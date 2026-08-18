import { NextResponse, type NextRequest } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

type Row = {
  storage: string; url: string | null; data: Buffer | null;
  mime: string; original_name: string; status: string;
};

/**
 * Serves an uploaded form. Files kept in Postgres are streamed from here;
 * files kept in an object store are redirected to their public URL. Only
 * files attached to a *published* application are reachable publicly.
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
      SELECT f.storage, f.url, f.data, f.mime, f.original_name, a.status
        FROM application_files f
        JOIN applications a ON a.id = f.application_id
       WHERE f.id = ${fileId} LIMIT 1`;
  } catch {
    return new NextResponse("Service unavailable", { status: 503 });
  }

  const file = rows[0];
  if (!file) return new NextResponse("Not found", { status: 404 });
  if (file.status !== "published") return new NextResponse("Not found", { status: 404 });

  if (file.storage === "blob" && file.url) {
    return NextResponse.redirect(file.url);
  }
  if (!file.data) return new NextResponse("Not found", { status: 404 });

  const download = request.nextUrl.searchParams.get("download") === "1";
  const bytes = Uint8Array.from(file.data);
  const filename = encodeURIComponent(file.original_name || `form-${fileId}`);

  return new NextResponse(bytes, {
    headers: {
      "Content-Type": file.mime || "application/octet-stream",
      "Content-Length": String(bytes.byteLength),
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename*=UTF-8''${filename}`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
