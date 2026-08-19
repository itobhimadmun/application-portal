"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "./db";
import {
  clientIp, createPendingSession, createSession, destroySession, findAdminByEmail,
  findAdminById, getPendingSession, getSessionUser, hashPassword, isLocked, logAttempt,
  LOCKOUT_MINUTES, recordFailure, recordSuccess, tooManyAttemptsFromIp, verifyPassword,
} from "./auth";
import { formatSecret, generateSecret, otpauthUri, verifyTotp } from "./totp";
import { getSiteSettings, saveSiteSettings, SETTING_KEYS, type SiteSettings } from "./settings";
import { buildSearchIndex } from "./translit";
import { slugify } from "./slug";
import { storeFile, removeStoredFile } from "./storage";
import { extractPlaceholders, isDocx } from "./docx-template";

export type ActionState = {
  ok?: boolean;
  error?: string;
  message?: string;
  /** Login is a two-stage flow: password first, then the authenticator code. */
  stage?: "password" | "totp" | "enroll";
  qr?: string;
  secretText?: string;
};

async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}

/* ------------------------------------------------------------------- auth */

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const next = String(formData.get("next") ?? "/admin");
  const safeNext = next.startsWith("/admin") ? next : "/admin";
  const ip = await clientIp();

  // ---------------------------------------------------------------- stage 2
  const code = String(formData.get("code") ?? "").trim();
  if (code) {
    const pending = await getPendingSession();
    if (!pending) {
      return { error: "That took too long. Enter your email and password again.", stage: "password" };
    }

    const row = await findAdminById(pending.userId);
    if (!row || !row.is_active || !row.totp_secret) {
      await destroySession();
      return { error: "Sign-in could not be completed.", stage: "password" };
    }
    if (isLocked(row)) {
      return { error: `Too many attempts. Try again in ${LOCKOUT_MINUTES} minutes.`, stage: "password" };
    }

    if (!verifyTotp(row.totp_secret, code)) {
      await recordFailure(row);
      await logAttempt(row.email, ip, false);
      return {
        error: "That code is not valid. Check your authenticator app and try again.",
        stage: pending.stage,
        ...(pending.stage === "enroll" ? await enrollmentPayload(row.email, row.totp_secret) : {}),
      };
    }

    if (pending.stage === "enroll") {
      await sql`UPDATE admin_users SET totp_enabled = TRUE WHERE id = ${row.id}`;
    }
    await recordSuccess(row.id);
    await logAttempt(row.email, ip, true);
    await createSession({
      id: row.id, email: row.email, name: row.name,
      role: row.role === "admin" ? "admin" : "editor",
    });
    redirect(safeNext);
  }

  // ---------------------------------------------------------------- stage 1
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) return { error: "Enter your email and password.", stage: "password" };

  if (await tooManyAttemptsFromIp(ip)) {
    return { error: "Too many sign-in attempts from this network. Try again later.", stage: "password" };
  }

  let row;
  try {
    row = await findAdminByEmail(email);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Sign-in is unavailable.", stage: "password" };
  }

  // Deliberately identical response whether the account exists or not.
  const generic = { error: "Incorrect email or password.", stage: "password" as const };

  if (!row || !row.is_active) {
    await logAttempt(email, ip, false);
    return generic;
  }
  if (isLocked(row)) {
    await logAttempt(email, ip, false);
    return { error: `Too many attempts. Try again in ${LOCKOUT_MINUTES} minutes.`, stage: "password" };
  }
  if (!(await verifyPassword(password, row.password_hash))) {
    await recordFailure(row);
    await logAttempt(email, ip, false);
    return generic;
  }

  // Password is correct — now require the second factor.
  if (row.totp_enabled && row.totp_secret) {
    await createPendingSession(row.id, "totp");
    return { stage: "totp" };
  }

  // No authenticator yet: enrolment is mandatory, it cannot be skipped.
  const secretValue = row.totp_secret || generateSecret();
  await sql`UPDATE admin_users SET totp_secret = ${secretValue}, totp_enabled = FALSE WHERE id = ${row.id}`;
  await createPendingSession(row.id, "enroll");
  return { stage: "enroll", ...(await enrollmentPayload(row.email, secretValue)) };
}

/** QR image (data URL) plus the typed-in fallback, for authenticator setup. */
async function enrollmentPayload(email: string, secretValue: string) {
  const site = await getSiteSettings();
  const uri = otpauthUri(secretValue, email, site.nameEn || "Municipal Portal");
  const QRCode = (await import("qrcode")).default;
  const qr = await QRCode.toDataURL(uri, { margin: 1, width: 220 });
  return { qr, secretText: formatSecret(secretValue) };
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/admin/login");
}

/* ----------------------------------------------------------- applications */

const fieldSchema = z.object({
  key: z.string().min(1),
  label_ne: z.string().default(""),
  label_en: z.string().default(""),
  type: z.enum(["text", "textarea", "number", "date"]).default("text"),
  required: z.boolean().optional(),
});

const payloadSchema = z.object({
  id: z.number().nullable().optional(),
  slug: z.string().default(""),
  title_ne: z.string().min(1, "Nepali title is required"),
  title_en: z.string().default(""),
  description_ne: z.string().default(""),
  description_en: z.string().default(""),
  about_ne: z.string().default(""),
  about_en: z.string().default(""),
  category_id: z.number().nullable().default(null),
  section_id: z.number().nullable().default(null),
  all_wards: z.boolean().default(true),
  ward_ids: z.array(z.number()).default([]),
  office_ne: z.string().default(""),
  office_en: z.string().default(""),
  fee_ne: z.string().default(""),
  fee_en: z.string().default(""),
  duration_ne: z.string().default(""),
  duration_en: z.string().default(""),
  keywords_ne: z.array(z.string()).default([]),
  keywords_en: z.array(z.string()).default([]),
  aliases: z.array(z.string()).default([]),
  status: z.enum(["draft", "published", "archived"]).default("draft"),
  is_sample: z.boolean().default(false),
  online_form_enabled: z.boolean().default(false),
  online_form_schema: z.array(fieldSchema).default([]),
  steps: z.array(z.object({
    title_ne: z.string().default(""), title_en: z.string().default(""),
    description_ne: z.string().default(""), description_en: z.string().default(""),
  })).default([]),
  requirements: z.array(z.object({
    label_ne: z.string().default(""), label_en: z.string().default(""),
    note_ne: z.string().default(""), note_en: z.string().default(""),
    is_required: z.boolean().default(true),
  })).default([]),
});

export type ApplicationPayload = z.infer<typeof payloadSchema>;

async function uniqueSlug(base: string, id: number | null): Promise<string> {
  let candidate = base || "service";
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const rows = await sql<{ id: number }[]>`SELECT id FROM applications WHERE slug = ${candidate} LIMIT 1`;
    if (!rows[0] || rows[0].id === id) return candidate;
    candidate = `${base}-${++n}`;
  }
}

export async function saveApplication(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();

  let data: ApplicationPayload;
  try {
    data = payloadSchema.parse(JSON.parse(String(formData.get("payload") ?? "{}")));
  } catch (error) {
    const message = error instanceof z.ZodError ? error.issues[0]?.message : "Invalid form data.";
    return { error: message ?? "Invalid form data." };
  }

  const override = String(formData.get("status_override") ?? "");
  if (override === "draft" || override === "published" || override === "archived") {
    data.status = override;
  }

  const slug = await uniqueSlug(data.slug ? slugify(data.slug) : slugify(data.title_en || data.title_ne), data.id ?? null);

  const searchIndex = buildSearchIndex([
    data.title_ne, data.title_en, data.description_ne, data.description_en,
    data.about_ne, data.about_en, data.office_ne, data.office_en,
    ...data.keywords_ne, ...data.keywords_en, ...data.aliases,
  ]);

  let applicationId = data.id ?? null;

  try {
    if (applicationId) {
      await sql`
        UPDATE applications SET
          slug = ${slug}, title_ne = ${data.title_ne}, title_en = ${data.title_en},
          description_ne = ${data.description_ne}, description_en = ${data.description_en},
          about_ne = ${data.about_ne}, about_en = ${data.about_en},
          category_id = ${data.category_id}, section_id = ${data.section_id},
          all_wards = ${data.all_wards}, office_ne = ${data.office_ne}, office_en = ${data.office_en},
          fee_ne = ${data.fee_ne}, fee_en = ${data.fee_en},
          duration_ne = ${data.duration_ne}, duration_en = ${data.duration_en},
          keywords_ne = ${data.keywords_ne}, keywords_en = ${data.keywords_en}, aliases = ${data.aliases},
          search_index = ${searchIndex}, status = ${data.status}, is_sample = ${data.is_sample},
          online_form_enabled = ${data.online_form_enabled},
          online_form_schema = ${sql.json(data.online_form_schema)},
          updated_by = ${user.id}, updated_at = now(),
          published_at = CASE WHEN ${data.status} = 'published' AND published_at IS NULL THEN now() ELSE published_at END
        WHERE id = ${applicationId}`;
    } else {
      const [row] = await sql<{ id: number }[]>`
        INSERT INTO applications (
          slug, title_ne, title_en, description_ne, description_en, about_ne, about_en,
          category_id, section_id, all_wards, office_ne, office_en, fee_ne, fee_en,
          duration_ne, duration_en, keywords_ne, keywords_en, aliases, search_index,
          status, is_sample, online_form_enabled, online_form_schema,
          created_by, updated_by, published_at
        ) VALUES (
          ${slug}, ${data.title_ne}, ${data.title_en}, ${data.description_ne}, ${data.description_en},
          ${data.about_ne}, ${data.about_en}, ${data.category_id}, ${data.section_id}, ${data.all_wards},
          ${data.office_ne}, ${data.office_en}, ${data.fee_ne}, ${data.fee_en},
          ${data.duration_ne}, ${data.duration_en}, ${data.keywords_ne}, ${data.keywords_en},
          ${data.aliases}, ${searchIndex}, ${data.status}, ${data.is_sample},
          ${data.online_form_enabled}, ${sql.json(data.online_form_schema)},
          ${user.id}, ${user.id}, ${data.status === "published" ? sql`now()` : null}
        ) RETURNING id`;
      applicationId = row.id;
    }

    await sql`DELETE FROM application_wards WHERE application_id = ${applicationId}`;
    if (!data.all_wards && data.ward_ids.length) {
      await sql`INSERT INTO application_wards ${sql(
        data.ward_ids.map((wardId) => ({ application_id: applicationId as number, ward_id: wardId })),
        "application_id", "ward_id"
      )}`;
    }

    await sql`DELETE FROM application_steps WHERE application_id = ${applicationId}`;
    const steps = data.steps.filter((s) => s.title_ne.trim() || s.title_en.trim());
    if (steps.length) {
      await sql`INSERT INTO application_steps ${sql(
        steps.map((s, i) => ({
          application_id: applicationId as number, position: i,
          title_ne: s.title_ne, title_en: s.title_en,
          description_ne: s.description_ne, description_en: s.description_en,
        })),
        "application_id", "position", "title_ne", "title_en", "description_ne", "description_en"
      )}`;
    }

    await sql`DELETE FROM application_documents WHERE application_id = ${applicationId}`;
    const docs = data.requirements.filter((d) => d.label_ne.trim() || d.label_en.trim());
    if (docs.length) {
      await sql`INSERT INTO application_documents ${sql(
        docs.map((d, i) => ({
          application_id: applicationId as number, position: i,
          label_ne: d.label_ne, label_en: d.label_en,
          note_ne: d.note_ne, note_en: d.note_en, is_required: d.is_required,
        })),
        "application_id", "position", "label_ne", "label_en", "note_ne", "note_en", "is_required"
      )}`;
    }
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save the application." };
  }

  revalidatePath("/admin/applications");
  revalidatePath("/services");
  revalidatePath(`/services/${slug}`);

  if (!data.id) redirect(`/admin/applications/${applicationId}?created=1`);
  return { ok: true, message: "Saved." };
}

export async function setApplicationStatus(
  id: number,
  status: "draft" | "published" | "archived",
  _formData?: FormData
): Promise<void> {
  const user = await requireUser();
  await sql`
    UPDATE applications
       SET status = ${status}, updated_by = ${user.id}, updated_at = now(),
           published_at = CASE WHEN ${status} = 'published' AND published_at IS NULL THEN now() ELSE published_at END
     WHERE id = ${id}`;
  revalidatePath("/admin/applications");
  revalidatePath("/services");
}

export async function deleteApplication(id: number, _formData?: FormData): Promise<void> {
  await requireUser();
  const files = await sql<{ storage: string; blob_pathname: string | null }[]>`
    SELECT storage, blob_pathname FROM application_files WHERE application_id = ${id}`;
  for (const file of files) await removeStoredFile(file.storage, file.blob_pathname);
  await sql`DELETE FROM applications WHERE id = ${id}`;
  revalidatePath("/admin/applications");
  revalidatePath("/services");
  redirect("/admin/applications");
}

/* ------------------------------------------------------------------ files */

export async function uploadApplicationFile(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const applicationId = Number(formData.get("application_id"));
  const file = formData.get("file");
  const labelNe = String(formData.get("label_ne") ?? "");
  const labelEn = String(formData.get("label_en") ?? "");
  const editable = formData.get("is_editable") === "on";

  if (!(file instanceof File) || file.size === 0) return { error: "Choose a file to upload." };

  let detected = 0;
  try {
    const stored = await storeFile(file);

    // A double-click or a page refresh must not attach the same file twice.
    const [duplicate] = await sql<{ id: number }[]>`
      SELECT id FROM application_files
       WHERE application_id = ${applicationId}
         AND original_name = ${stored.originalName}
         AND size = ${stored.size}
       LIMIT 1`;
    if (duplicate) {
      return { ok: true, message: "That file is already attached to this application." };
    }
    const [{ position }] = await sql<{ position: number }[]>`
      SELECT COALESCE(max(position) + 1, 0) AS position FROM application_files WHERE application_id = ${applicationId}`;

    // A .docx is scanned for {{placeholders}}; each one becomes a form field
    // the administrator can label, and a citizen can then fill online.
    let templateFields: { key: string; label_ne: string; label_en: string; type: string }[] = [];
    if (isDocx(file.name, stored.mime)) {
      try {
        const bytes = stored.data ?? Buffer.from(await file.arrayBuffer());
        templateFields = (await extractPlaceholders(bytes)).map((key) => ({
          key,
          label_ne: "",
          label_en: key.replace(/[_.\-]+/g, " "),
          type: "text",
        }));
      } catch {
        templateFields = [];
      }
    }
    detected = templateFields.length;

    await sql`
      INSERT INTO application_files
        (application_id, position, label_ne, label_en, kind, is_editable, storage, url, blob_pathname,
         data, mime, size, original_name, is_template, template_fields)
      VALUES
        (${applicationId}, ${position}, ${labelNe}, ${labelEn}, ${stored.kind}, ${editable},
         ${stored.storage}, ${stored.url}, ${stored.blobPathname}, ${stored.data}, ${stored.mime},
         ${stored.size}, ${stored.originalName}, ${detected > 0},
         ${sql.json(templateFields)})`;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Upload failed." };
  }

  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath("/services");
  return {
    ok: true,
    message: detected
      ? `File uploaded — ${detected} fillable field${detected === 1 ? "" : "s"} detected. Label them below.`
      : "File uploaded.",
  };
}

/** Save the Nepali/English labels an administrator gave a template's fields. */
export async function saveTemplateFields(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const fileId = Number(formData.get("file_id"));
  const applicationId = Number(formData.get("application_id"));

  let fields;
  try {
    fields = z.array(z.object({
      key: z.string().min(1),
      label_ne: z.string().default(""),
      label_en: z.string().default(""),
      type: z.enum(["text", "textarea", "number", "date"]).default("text"),
    })).parse(JSON.parse(String(formData.get("fields") ?? "[]")));
  } catch {
    return { error: "Could not read the field list." };
  }

  await sql`UPDATE application_files
               SET template_fields = ${sql.json(fields)},
                   is_template = ${fields.length > 0}
             WHERE id = ${fileId}`;

  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath("/services");
  return { ok: true, message: "Field labels saved." };
}

export async function deleteApplicationFile(
  fileId: number,
  applicationId: number,
  _formData?: FormData
): Promise<void> {
  await requireUser();
  const [file] = await sql<{ storage: string; blob_pathname: string | null }[]>`
    SELECT storage, blob_pathname FROM application_files WHERE id = ${fileId}`;
  if (file) await removeStoredFile(file.storage, file.blob_pathname);
  await sql`DELETE FROM application_files WHERE id = ${fileId}`;
  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath("/services");
}

/* --------------------------------------------------------------- taxonomy */

export async function saveCategory(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = Number(formData.get("id")) || null;
  const nameNe = String(formData.get("name_ne") ?? "").trim();
  const nameEn = String(formData.get("name_en") ?? "").trim();
  const icon = String(formData.get("icon") ?? "doc");
  if (!nameNe && !nameEn) return { error: "Enter a category name." };
  const slug = slugify(String(formData.get("slug") || nameEn || nameNe));

  if (id) {
    await sql`UPDATE categories SET name_ne=${nameNe}, name_en=${nameEn}, icon=${icon}, slug=${slug} WHERE id=${id}`;
  } else {
    await sql`INSERT INTO categories (slug, name_ne, name_en, icon) VALUES (${slug}, ${nameNe}, ${nameEn}, ${icon})
              ON CONFLICT (slug) DO UPDATE SET name_ne=EXCLUDED.name_ne, name_en=EXCLUDED.name_en, icon=EXCLUDED.icon`;
  }
  revalidatePath("/admin/taxonomy");
  revalidatePath("/");
  return { ok: true, message: "Saved." };
}

export async function saveSection(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const id = Number(formData.get("id")) || null;
  const nameNe = String(formData.get("name_ne") ?? "").trim();
  const nameEn = String(formData.get("name_en") ?? "").trim();
  const contact = String(formData.get("contact") ?? "");
  if (!nameNe && !nameEn) return { error: "Enter a section name." };
  const slug = slugify(String(formData.get("slug") || nameEn || nameNe));

  if (id) {
    await sql`UPDATE sections SET name_ne=${nameNe}, name_en=${nameEn}, contact=${contact}, slug=${slug} WHERE id=${id}`;
  } else {
    await sql`INSERT INTO sections (slug, name_ne, name_en, contact) VALUES (${slug}, ${nameNe}, ${nameEn}, ${contact})
              ON CONFLICT (slug) DO UPDATE SET name_ne=EXCLUDED.name_ne, name_en=EXCLUDED.name_en`;
  }
  revalidatePath("/admin/taxonomy");
  revalidatePath("/");
  return { ok: true, message: "Saved." };
}

export async function saveWard(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireUser();
  const number = Number(formData.get("number"));
  if (!Number.isInteger(number) || number < 1) return { error: "Ward number must be a positive whole number." };
  const officeNe = String(formData.get("office_ne") ?? "");
  const officeEn = String(formData.get("office_en") ?? "");
  const contact = String(formData.get("contact") ?? "");

  await sql`
    INSERT INTO wards (number, office_ne, office_en, contact)
    VALUES (${number}, ${officeNe}, ${officeEn}, ${contact})
    ON CONFLICT (number) DO UPDATE
      SET office_ne = EXCLUDED.office_ne, office_en = EXCLUDED.office_en, contact = EXCLUDED.contact`;
  revalidatePath("/admin/taxonomy");
  revalidatePath("/");
  return { ok: true, message: "Saved." };
}

export async function deleteTaxonomy(
  kind: "category" | "section" | "ward",
  id: number,
  _formData?: FormData
): Promise<void> {
  await requireUser();
  if (kind === "category") await sql`DELETE FROM categories WHERE id = ${id}`;
  if (kind === "section") await sql`DELETE FROM sections WHERE id = ${id}`;
  if (kind === "ward") await sql`DELETE FROM wards WHERE id = ${id}`;
  revalidatePath("/admin/taxonomy");
  revalidatePath("/");
}

/* --------------------------------------------------------------- settings */

/**
 * Portal identity — municipality name, address, contact, logo. Saved to the
 * database, so the change is live everywhere on the next page load with no
 * redeploy and no environment-variable editing.
 */
export async function saveSettings(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "admin") return { error: "Only an administrator can change portal settings." };

  const values: Partial<SiteSettings> = {};
  for (const key of SETTING_KEYS) {
    const raw = formData.get(key);
    if (typeof raw === "string") values[key] = raw.trim();
  }
  if (!values.nameNe && !values.nameEn) {
    return { error: "Enter the municipality name in at least one language." };
  }

  try {
    await saveSiteSettings(values);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save settings." };
  }

  revalidatePath("/", "layout");
  return { ok: true, message: "Settings saved. The new name appears across the portal immediately." };
}

/* ------------------------------------------------------------ admin users */

export async function createAdminUser(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireUser();
  if (user.role !== "admin") return { error: "Only an administrator can add users." };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const role = formData.get("role") === "admin" ? "admin" : "editor";

  if (!email.includes("@")) return { error: "Enter a valid email address." };
  if (password.length < 8) return { error: "Password must be at least 8 characters." };

  try {
    await sql`
      INSERT INTO admin_users (email, name, password_hash, role)
      VALUES (${email}, ${name || email}, ${await hashPassword(password)}, ${role})`;
  } catch {
    return { error: "That email address is already registered." };
  }
  revalidatePath("/admin/taxonomy");
  return { ok: true, message: "User created." };
}
