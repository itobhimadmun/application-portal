import { NextResponse, type NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { blankRules } from "@/lib/docx-blank";
import { fillDocxTemplate } from "@/lib/docx-template";
import type { TemplateField } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Row = {
  storage: string; url: string | null; data: Buffer | null;
  mime: string; original_name: string; status: string;
  is_template: boolean; template_fields: TemplateField[] | string;
};

const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function asFields(value: unknown): TemplateField[] {
  if (Array.isArray(value)) return value as TemplateField[];
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as TemplateField[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

/**
 * Serves an uploaded form.
 *
 * A template is never handed out as it was uploaded: its `{{placeholders}}`
 * would be meaningless to a citizen. What downloads instead is a blank copy —
 * every placeholder replaced by a ruled line — which is exactly the sheet
 * someone wants when they intend to print the form and complete it by pen.
 * The online editor works from the stored original, so one upload serves both
 * and the two can never drift apart.
 *
 * `?raw=1` returns the file as uploaded, placeholders and all. Staff need that
 * to edit the template, so it requires a session.
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const fileId = Number(id);
  if (!Number.isFinite(fileId)) return new NextResponse("Not found", { status: 404 });

  let rows: Row[];
  try {
    rows = await sql<Row[]>`
      SELECT f.storage, f.url, f.data, f.mime, f.original_name,
             f.is_template, f.template_fields, a.status
        FROM application_files f
        JOIN applications a ON a.id = f.application_id
       WHERE f.id = ${fileId} LIMIT 1`;
  } catch {
    return new NextResponse("Service unavailable", { status: 503 });
  }

  const file = rows[0];
  if (!file) return new NextResponse("Not found", { status: 404 });

  const wantsRaw = request.nextUrl.searchParams.get("raw") === "1";
  const staff = wantsRaw ? await getSessionUser() : null;

  // An unpublished application is staff-only, whichever copy is asked for.
  if (file.status !== "published" && !staff) {
    return new NextResponse("Not found", { status: 404 });
  }
  if (wantsRaw && !staff) return new NextResponse("Not found", { status: 404 });

  const download = request.nextUrl.searchParams.get("download") === "1";
  const blankCopy = file.is_template && !wantsRaw;

  // Blank-filling has to happen here, so the bytes are needed either way.
  if (file.storage === "blob" && file.url && !blankCopy) {
    return NextResponse.redirect(file.url);
  }

  let bytes: Buffer | null = null;
  if (file.storage === "blob" && file.url) {
    const upstream = await fetch(file.url);
    if (upstream.ok) bytes = Buffer.from(await upstream.arrayBuffer());
  } else if (file.data) {
    bytes = Buffer.from(file.data);
  }
  if (!bytes) return new NextResponse("Not found", { status: 404 });

  let name = file.original_name || `form-${fileId}`;
  let mime = file.mime || "application/octet-stream";

  if (blankCopy) {
    try {
      const fields = asFields(file.template_fields);
      bytes = await fillDocxTemplate(bytes, {}, blankRules(fields));
      name = name.replace(/\.docx$/i, "") + "-blank.docx";
      mime = DOCX_MIME;
    } catch {
      // A template we cannot rewrite is still better delivered than withheld.
    }
  }

  const body = Uint8Array.from(bytes);
  return new NextResponse(body, {
    headers: {
      "Content-Type": mime,
      "Content-Length": String(body.byteLength),
      "Content-Disposition":
        `${download ? "attachment" : "inline"}; filename*=UTF-8''${encodeURIComponent(name)}`,
      // A blank copy is generated per request and a raw copy is staff-only;
      // neither belongs in a shared cache.
      "Cache-Control": blankCopy || wantsRaw ? "no-store" : "public, max-age=3600",
    },
  });
}
