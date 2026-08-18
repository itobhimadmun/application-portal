import type { FileKind } from "./types";

/**
 * Two interchangeable storage backends:
 *
 *  • "blob" — Vercel Blob, used automatically when BLOB_READ_WRITE_TOKEN is
 *    present. Recommended once the library grows past a few hundred files.
 *  • "db"   — the bytes are stored in a Postgres BYTEA column. This is the
 *    default so the portal can be deployed on Vercel with *only* a free
 *    Postgres database and no extra storage service to configure.
 *
 * Either way, uploads are never written to the Vercel filesystem, which is
 * ephemeral and read-only in production.
 */

export const MAX_UPLOAD_BYTES =
  Number(process.env.MAX_UPLOAD_MB || (process.env.BLOB_READ_WRITE_TOKEN ? 20 : 6)) * 1024 * 1024;

const ALLOWED: { ext: string[]; mime: string[]; kind: FileKind }[] = [
  { ext: [".pdf"], mime: ["application/pdf"], kind: "pdf" },
  {
    ext: [".doc", ".docx", ".odt", ".rtf"],
    mime: [
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.oasis.opendocument.text",
      "application/rtf",
    ],
    kind: "word",
  },
  {
    ext: [".xls", ".xlsx", ".ods", ".csv"],
    mime: [
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.oasis.opendocument.spreadsheet",
      "text/csv",
    ],
    kind: "excel",
  },
];

export function detectKind(filename: string, mime: string): FileKind | null {
  const lower = filename.toLowerCase();
  for (const entry of ALLOWED) {
    if (entry.ext.some((e) => lower.endsWith(e))) return entry.kind;
    if (entry.mime.includes(mime)) return entry.kind;
  }
  return null;
}

export const ACCEPT_ATTRIBUTE = ALLOWED.flatMap((a) => a.ext).join(",");

export type StoredFile = {
  storage: "db" | "blob";
  url: string | null;
  blobPathname: string | null;
  data: Buffer | null;
  mime: string;
  size: number;
  originalName: string;
  kind: FileKind;
};

export async function storeFile(file: File): Promise<StoredFile> {
  const kind = detectKind(file.name, file.type);
  if (!kind) {
    throw new Error("Unsupported file type. Allowed: PDF, Word (doc/docx/odt/rtf), Excel (xls/xlsx/ods/csv).");
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error(`File is too large. Maximum size is ${Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)} MB.`);
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const safeName = file.name.replace(/[^\w.\-ऀ-ॿ]+/g, "_").slice(-120);

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const pathname = `forms/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${safeName}`;
    const blob = await put(pathname, bytes, {
      access: "public",
      contentType: file.type || "application/octet-stream",
    });
    return {
      storage: "blob", url: blob.url, blobPathname: blob.pathname, data: null,
      mime: file.type || "application/octet-stream", size: bytes.byteLength,
      originalName: safeName, kind,
    };
  }

  return {
    storage: "db", url: null, blobPathname: null, data: bytes,
    mime: file.type || "application/octet-stream", size: bytes.byteLength,
    originalName: safeName, kind,
  };
}

export async function removeStoredFile(storage: string, blobPathname: string | null): Promise<void> {
  if (storage === "blob" && blobPathname && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { del } = await import("@vercel/blob");
      await del(blobPathname);
    } catch {
      /* the database row is the source of truth; ignore orphaned blobs */
    }
  }
}

export function humanSize(bytes: number): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}
