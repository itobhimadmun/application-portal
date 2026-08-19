import { sql } from "./db";
import { searchVariants } from "./translit";
import type {
  ApplicationDetail, ApplicationFile, ApplicationStep, ApplicationSummary, Category,
  RequiredDocument, SearchParamsShape, Section, Status, Ward,
} from "./types";

/* ------------------------------------------------------------------ taxonomy */

export async function getCategories(): Promise<Category[]> {
  return sql<Category[]>`SELECT * FROM categories WHERE is_active ORDER BY sort_order, name_en`;
}

export async function getSections(): Promise<Section[]> {
  return sql<Section[]>`SELECT * FROM sections WHERE is_active ORDER BY sort_order, name_en`;
}

export async function getWards(): Promise<Ward[]> {
  return sql<Ward[]>`SELECT * FROM wards WHERE is_active ORDER BY number`;
}

/* -------------------------------------------------------------------- search */

/** Built lazily so importing this module never touches the database. */
const summarySelect = () => sql`
  a.id, a.slug, a.title_ne, a.title_en, a.description_ne, a.description_en,
  a.status, a.is_sample, a.all_wards, a.office_ne, a.office_en,
  a.online_form_enabled, a.updated_at,
  c.slug AS category_slug, c.name_ne AS category_name_ne, c.name_en AS category_name_en,
  s.slug AS section_slug, s.name_ne AS section_name_ne, s.name_en AS section_name_en,
  (SELECT count(*)::int FROM application_documents d WHERE d.application_id = a.id) AS document_count,
  (SELECT count(*)::int FROM application_steps st WHERE st.application_id = a.id) AS step_count,
  COALESCE((SELECT array_agg(DISTINCT f.kind) FROM application_files f WHERE f.application_id = a.id), '{}') AS file_kinds,
  COALESCE((SELECT array_agg(w.number ORDER BY w.number) FROM application_wards aw
              JOIN wards w ON w.id = aw.ward_id WHERE aw.application_id = a.id), '{}') AS ward_numbers
`;


/**
 * The heart of the portal. Combines four free, self-hosted techniques:
 *  1. substring match on a pre-built index that already contains Nepali,
 *     English, romanised and "skeleton" spellings of every keyword,
 *  2. trigram word-similarity for typo tolerance,
 *  3. an exact-title bonus so obvious matches rank first,
 *  4. plain filters that compose with the query.
 * No external AI service is involved.
 */
export async function searchApplications(
  params: SearchParamsShape & { status?: Status | "any" }
): Promise<{ items: ApplicationSummary[]; total: number }> {
  const status = params.status ?? "published";
  const page = Math.max(1, Number(params.page) || 1);
  const perPage = Math.min(60, Math.max(1, Number(params.perPage) || 12));
  const offset = (page - 1) * perPage;

  const raw = (params.q ?? "").trim();
  const variants = raw ? Array.from(new Set(searchVariants(raw))) : [];
  const hasQuery = variants.length > 0;

  const conditions = [
    status === "any" ? sql`TRUE` : sql`a.status = ${status}`,
  ];
  if (params.category) conditions.push(sql`c.slug = ${params.category}`);
  if (params.section) conditions.push(sql`s.slug = ${params.section}`);
  if (params.ward) {
    const wardNumber = Number(params.ward);
    conditions.push(sql`(a.all_wards OR EXISTS (
      SELECT 1 FROM application_wards aw JOIN wards w ON w.id = aw.ward_id
      WHERE aw.application_id = a.id AND w.number = ${wardNumber}))`);
  }
  if (params.doc) {
    if (params.doc === "online") {
      conditions.push(sql`a.online_form_enabled`);
    } else if (params.doc === "printable") {
      conditions.push(sql`EXISTS (SELECT 1 FROM application_files f WHERE f.application_id = a.id)`);
    } else {
      conditions.push(sql`EXISTS (SELECT 1 FROM application_files f
        WHERE f.application_id = a.id AND f.kind = ${params.doc})`);
    }
  }
  if (hasQuery) {
    conditions.push(sql`EXISTS (
      SELECT 1 FROM unnest(${variants}::text[]) AS v
      WHERE a.search_index LIKE '%' || v || '%'
         OR word_similarity(v, a.search_index) > 0.55
    )`);
  }

  const where = conditions.reduce((acc, cond) => sql`${acc} AND ${cond}`);

  const score = hasQuery
    ? sql`(SELECT COALESCE(max(
          (CASE WHEN a.search_index LIKE '%' || v || '%' THEN 0.9 ELSE 0 END)
        + (word_similarity(v, a.search_index) * 0.6)
        + (CASE WHEN lower(a.title_ne) = v OR lower(a.title_en) = v THEN 1.5 ELSE 0 END)
        + (CASE WHEN lower(a.title_ne) LIKE '%' || v || '%' OR lower(a.title_en) LIKE '%' || v || '%' THEN 0.5 ELSE 0 END)
      ), 0) FROM unnest(${variants}::text[]) AS v)`
    : sql`0`;

  const items = await sql<ApplicationSummary[]>`
    SELECT ${summarySelect()}, ${score}::float AS score
      FROM applications a
      LEFT JOIN categories c ON c.id = a.category_id
      LEFT JOIN sections   s ON s.id = a.section_id
     WHERE ${where}
     ORDER BY ${hasQuery ? sql`score DESC, a.updated_at DESC` : sql`a.updated_at DESC`}
     LIMIT ${perPage} OFFSET ${offset}`;

  const [{ count }] = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count
      FROM applications a
      LEFT JOIN categories c ON c.id = a.category_id
      LEFT JOIN sections   s ON s.id = a.section_id
     WHERE ${where}`;

  return { items, total: count };
}

export async function logSearch(term: string, results: number): Promise<void> {
  const clean = term.trim().slice(0, 120);
  if (!clean) return;
  try {
    await sql`INSERT INTO search_log (term, results) VALUES (${clean}, ${results})`;
  } catch {
    /* search analytics must never break a page render */
  }
}

/* --------------------------------------------------------------- single item */

export async function getApplicationBySlug(
  slug: string,
  opts: { includeUnpublished?: boolean } = {}
): Promise<ApplicationDetail | null> {
  const rows = await sql<ApplicationDetail[]>`
    SELECT ${summarySelect()},
           a.about_ne, a.about_en, a.fee_ne, a.fee_en, a.duration_ne, a.duration_en,
           a.keywords_ne, a.keywords_en, a.aliases, a.online_form_schema,
           a.view_count, a.created_at, a.published_at
      FROM applications a
      LEFT JOIN categories c ON c.id = a.category_id
      LEFT JOIN sections   s ON s.id = a.section_id
     WHERE a.slug = ${slug}
       AND ${opts.includeUnpublished ? sql`TRUE` : sql`a.status = 'published'`}
     LIMIT 1`;

  const app = rows[0];
  if (!app) return null;
  return hydrate(app);
}

export async function getApplicationById(id: number): Promise<ApplicationDetail | null> {
  const rows = await sql<ApplicationDetail[]>`
    SELECT ${summarySelect()},
           a.about_ne, a.about_en, a.fee_ne, a.fee_en, a.duration_ne, a.duration_en,
           a.keywords_ne, a.keywords_en, a.aliases, a.online_form_schema,
           a.view_count, a.created_at, a.published_at
      FROM applications a
      LEFT JOIN categories c ON c.id = a.category_id
      LEFT JOIN sections   s ON s.id = a.section_id
     WHERE a.id = ${id} LIMIT 1`;
  const app = rows[0];
  if (!app) return null;
  return hydrate(app);
}

/**
 * jsonb columns should arrive as arrays, but a row written by an older build
 * may hold a JSON *string*. Coerce either shape so the UI never sees a string.
 */
function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

async function hydrate(app: ApplicationDetail): Promise<ApplicationDetail> {
  const [steps, requirements, files] = await Promise.all([
    sql<ApplicationStep[]>`
      SELECT * FROM application_steps WHERE application_id = ${app.id} ORDER BY position, id`,
    sql<RequiredDocument[]>`
      SELECT * FROM application_documents WHERE application_id = ${app.id} ORDER BY position, id`,
    sql<ApplicationFile[]>`
      SELECT id, application_id, position, label_ne, label_en, kind, is_editable, storage,
             url, blob_pathname, mime, size, original_name, created_at,
             is_template, template_fields
        FROM application_files WHERE application_id = ${app.id} ORDER BY position, id`,
  ]);
  return {
    ...app,
    online_form_schema: asArray(app.online_form_schema),
    steps: [...steps],
    requirements: [...requirements],
    files: files.map((file) => ({
      ...file,
      template_fields: asArray(file.template_fields),
    })),
  };
}

export async function registerView(id: number): Promise<void> {
  try {
    await sql`UPDATE applications SET view_count = view_count + 1 WHERE id = ${id}`;
  } catch {
    /* ignore */
  }
}

export async function getRelatedApplications(
  app: ApplicationSummary, limit = 4
): Promise<ApplicationSummary[]> {
  return sql<ApplicationSummary[]>`
    SELECT ${summarySelect()}
      FROM applications a
      LEFT JOIN categories c ON c.id = a.category_id
      LEFT JOIN sections   s ON s.id = a.section_id
     WHERE a.status = 'published' AND a.id <> ${app.id}
       AND (c.slug = ${app.category_slug} OR s.slug = ${app.section_slug})
     ORDER BY (c.slug = ${app.category_slug}) DESC, a.updated_at DESC
     LIMIT ${limit}`;
}

export async function getRecentApplications(limit = 6): Promise<ApplicationSummary[]> {
  return sql<ApplicationSummary[]>`
    SELECT ${summarySelect()}
      FROM applications a
      LEFT JOIN categories c ON c.id = a.category_id
      LEFT JOIN sections   s ON s.id = a.section_id
     WHERE a.status = 'published'
     ORDER BY COALESCE(a.published_at, a.updated_at) DESC
     LIMIT ${limit}`;
}

/* --------------------------------------------------------------- statistics */

export async function getStats() {
  const [row] = await sql<
    {
      total: number; published: number; draft: number; archived: number;
      categories: number; sections: number; wards: number; files: number;
    }[]
  >`SELECT
      (SELECT count(*)::int FROM applications)                              AS total,
      (SELECT count(*)::int FROM applications WHERE status='published')     AS published,
      (SELECT count(*)::int FROM applications WHERE status='draft')         AS draft,
      (SELECT count(*)::int FROM applications WHERE status='archived')      AS archived,
      (SELECT count(*)::int FROM categories WHERE is_active)                AS categories,
      (SELECT count(*)::int FROM sections   WHERE is_active)                AS sections,
      (SELECT count(*)::int FROM wards      WHERE is_active)                AS wards,
      (SELECT count(*)::int FROM application_files)                         AS files`;
  return row;
}

export async function getPublishedCount(): Promise<number> {
  const [row] = await sql<{ count: number }[]>`
    SELECT count(*)::int AS count FROM applications WHERE status = 'published'`;
  return row?.count ?? 0;
}

export async function getPopularSearches(limit = 6): Promise<string[]> {
  const rows = await sql<{ term: string }[]>`
    SELECT term FROM search_log
     WHERE created_at > now() - interval '90 days' AND results > 0
     GROUP BY term ORDER BY count(*) DESC LIMIT ${limit}`;
  return rows.map((r) => r.term);
}
