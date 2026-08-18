import { NextResponse, type NextRequest } from "next/server";
import { LOCALE_COOKIE } from "@/lib/i18n";

export async function GET(request: NextRequest) {
  const requested = request.nextUrl.searchParams.get("set");
  const locale = requested === "en" ? "en" : "ne";

  // Only allow same-origin relative redirects.
  const raw = request.nextUrl.searchParams.get("next") || "/";
  const next = raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";

  const response = NextResponse.redirect(new URL(next, request.nextUrl.origin));
  response.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });
  return response;
}
