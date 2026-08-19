import { NextResponse } from "next/server";
import { readBrandingAsset } from "@/lib/branding";

export const dynamic = "force-dynamic";

/**
 * Serves the portal's emblem.
 *
 * Cached for a year: the URL stored in settings carries the upload timestamp,
 * so replacing the image changes the URL and every browser picks it up at once.
 *
 * An SVG can carry script, and although this one only ever appears inside an
 * `<img>` — where script never runs — someone could open the URL directly. The
 * response is therefore sandboxed and told to run nothing, so an uploaded file
 * cannot execute anything on the portal's own origin.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ key: string }> }
) {
  const { key } = await context.params;
  if (!/^[a-z0-9_-]{1,40}$/.test(key)) return new NextResponse("Not found", { status: 404 });

  let asset;
  try {
    asset = await readBrandingAsset(key);
  } catch {
    return new NextResponse("Service unavailable", { status: 503 });
  }
  if (!asset) return new NextResponse("Not found", { status: 404 });

  const body = Uint8Array.from(asset.data);
  return new NextResponse(body, {
    headers: {
      "Content-Type": asset.mime,
      "Content-Length": String(body.byteLength),
      "Cache-Control": "public, max-age=31536000, immutable",
      "Last-Modified": asset.updatedAt.toUTCString(),
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
