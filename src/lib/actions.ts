"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { sql } from "./db";
import { authenticate, createSession, destroySession, getSessionUser, hashPassword } from "./auth";
import { buildSearchIndex } from "./translit";
import { slugify } from "./slug";
import { storeFile, removeStoredFile } from "./storage";

export type ActionState = { ok?: boolean; error?: string; message?: string };

async function requireUser() {
  const user = await getSessionUser();
  if (!user) redirect("/admin/login");
  return user;
}

/* ------------------------------------------------------------------- auth */

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");

  if (!email || !password) return { error: "Enter your email and password." };

  let user;
  try {
    user = await authenticate(email, password);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Login is unavailable." };
  }
  if (!user) return { error: "Incorrect email or password." };

  await createSession(user);
  redirect(next.startsWith("/admin") ? next : "/admin");
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
          online_form_schema = ${JSON.stringify(data.online_form_schema)}::jsonb,
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
          ${data.online_form_enabled}, ${JSON.stringify(data.online_form_schema)}::jsonb,
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

  try {
    const stored = await storeFile(file);
    const [{ position }] = await sql<{ position: number }[]>`
      SELECT COALESCE(max(position) + 1, 0) AS position FROM application_files WHERE application_id = ${applicationId}`;

    await sql`
      INSERT INTO application_files
        (application_id, position, label_ne, label_en, kind, is_editable, storage, url, blob_pathname, data, mime, size, original_name)
      VALUES
        (${applicationId}, ${position}, ${labelNe}, ${labelEn}, ${stored.kind}, ${editable},
         ${stored.storage}, ${stored.url}, ${stored.blobPathname}, ${stored.data}, ${stored.mime},
         ${stored.size}, ${stored.originalName})`;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Upload failed." };
  }

  revalidatePath(`/admin/applications/${applicationId}`);
  revalidatePath("/services");
  return { ok: true, message: "File uploaded." };
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
