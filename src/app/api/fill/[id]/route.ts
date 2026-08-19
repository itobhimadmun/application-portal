import { NextResponse, type NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { fillDocxTemplate } from "@/lib/docx-template";
import { blankRules } from "@/lib/docx-blank";
import type { TemplateField } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

type Row = {
  storage: string; url: string | null; data: Buffer | null;
  original_name: string; template_fields: TemplateField[]; status: string;
};

/**
 * Fills a .docx template with the values a citizen typed and streams the
 * completed document back. Nothing is stored — the submission exists only for
 * the lifetime of this request.
 */
export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const fileId = Number(id);
  if (!Number.isFinite(fileId)) return new NextResponse("Not found", { status: 404 });

  let rows: Row[];
  try {
    rows = await sql<Row[]>`
      SELECT f.storage, f.url, f.data, f.original_name, f.template_fields, a.status
        FROM application_files f
        JOIN applications a ON a.id = f.application_id
       WHERE f.id = ${fileId} AND f.is_template LIMIT 1`;
  } catch {
    return new NextResponse("Service unavailable", { status: 503 });
  }

  const file = rows[0];
  if (!file || file.status !== "published") return new NextResponse("Not found", { status: 404 });

  let submitted: Record<string, unknown>;
  try {
    submitted = await request.json();
  } catch {
    return new NextResponse("Invalid request", { status: 400 });
  }

  // Only placeholders the template actually declares are honoured.
  const values: Record<string, string> = {};
  for (const field of file.template_fields ?? []) {
    const raw = submitted[field.key];
    values[field.key] = typeof raw === "string" ? raw.slice(0, 2000) : "";
  }

  let source: Buffer;
  if (file.storage === "blob" && file.url) {
    const upstream = await fetch(file.url);
    if (!upstream.ok) return new NextResponse("Template unavailable", { status: 502 });
    source = Buffer.from(await upstream.arrayBuffer());
  } else if (file.data) {
    source = Buffer.from(file.data);
  } else {
    return new NextResponse("Not found", { status: 404 });
  }

  try {
    // Anything the citizen left empty becomes a ruled line, so a
    // part-completed download can still be finished by hand.
    const filled = await fillDocxTemplate(source, values, blankRules(file.template_fields ?? []));
    const name = encodeURIComponent(file.original_name.replace(/\.docx$/i, "") || "application");
    return new NextResponse(Uint8Array.from(filled), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename*=UTF-8''${name}-filled.docx`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new NextResponse("Could not fill this template", { status: 500 });
  }
}
