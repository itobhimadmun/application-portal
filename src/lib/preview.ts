import { sql } from "./db";
import { renderDocxToHtml } from "./docx-html";
import type { ApplicationFile, DocxPageBox } from "./types";

/**
 * The rendered form, ready to be shown as a page.
 *
 * Parsing a .docx costs real time and the same document is served to every
 * visitor, so the HTML is built once — at upload — and cached in the row
 * beside the file. Files that predate the cache are rendered on first view and
 * cached from then on.
 */
export type DocumentPreview = {
  html: string;
  page: DocxPageBox;
};

/** Used only when a document's own page size is missing or nonsensical. */
const A4: DocxPageBox = {
  width: 595, height: 842,
  marginTop: 57, marginRight: 62, marginBottom: 57, marginLeft: 62,
};

function usable(page: DocxPageBox | null | undefined): page is DocxPageBox {
  return Boolean(page && typeof page.width === "number" && page.width > 0);
}

/** Read the stored bytes of a file, wherever it lives. */
async function readBytes(fileId: number): Promise<Buffer | null> {
  const rows = await sql<{ storage: string; url: string | null; data: Buffer | null }[]>`
    SELECT storage, url, data FROM application_files WHERE id = ${fileId} LIMIT 1`;
  const row = rows[0];
  if (!row) return null;

  if (row.storage === "blob" && row.url) {
    const upstream = await fetch(row.url);
    return upstream.ok ? Buffer.from(await upstream.arrayBuffer()) : null;
  }
  return row.data ? Buffer.from(row.data) : null;
}

/** Render a .docx and remember the result against its row. */
async function build(fileId: number): Promise<DocumentPreview | null> {
  const bytes = await readBytes(fileId);
  if (!bytes) return null;

  const rendered = await renderDocxToHtml(bytes);
  await sql`
    UPDATE application_files
       SET preview_html = ${rendered.html}, preview_page = ${sql.json(rendered.page)}
     WHERE id = ${fileId}`;

  return { html: rendered.html, page: rendered.page };
}

/**
 * The preview for a file, from cache when possible. Returns null for anything
 * that is not a Word document — a PDF goes to the browser's own viewer.
 */
export async function getPreview(file: ApplicationFile): Promise<DocumentPreview | null> {
  if (file.kind !== "word") return null;

  if (file.preview_html) {
    return { html: file.preview_html, page: usable(file.preview_page) ? file.preview_page : A4 };
  }

  try {
    return await build(file.id);
  } catch {
    return null; // an unreadable file must not take the page down
  }
}

/**
 * The file a page should lead with: the fillable template if there is one,
 * otherwise the first Word document, otherwise the first file of any kind.
 */
export function primaryFile(files: ApplicationFile[]): ApplicationFile | undefined {
  return files.find((file) => file.is_template)
    ?? files.find((file) => file.kind === "word")
    ?? files[0];
}
