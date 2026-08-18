import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { SESSION_COOKIE } from "@/lib/auth";

// v2: sign-in lives at /member-login; /admin/* requires a full (2FA-complete) session.
const PROTECTED = /^\/admin(?!\/login)/;
const SIGN_IN_PATHS = new Set(["/admin/login", "/member-login"]);

/**
 * Edge guard for the administration area.
 *
 *  • Verifies the signed session cookie before any admin page or server action
 *    is reached, and requires stage === "full" so a half-authenticated session
 *    (password accepted, second factor not yet proven) cannot get in.
 *  • Marks every admin and sign-in URL noindex/nofollow so the entrance never
 *    turns up in a search engine.
 *  • Optionally restricts the admin area to known networks via
 *    ADMIN_IP_ALLOWLIST (comma-separated IPs or CIDR prefixes). Unset = open.
 */
function ipAllowed(request: NextRequest): boolean {
  const raw = process.env.ADMIN_IP_ALLOWLIST?.trim();
  if (!raw) return true;

  const ip = (request.headers.get("x-forwarded-for")?.split(",")[0] ?? "").trim();
  if (!ip) return false;

  return raw.split(",").map((e) => e.trim()).filter(Boolean).some((entry) => {
    if (entry.includes("/")) {
      // Prefix match on the dotted-quad portion, enough for /8, /16, /24.
      const [network, bits] = entry.split("/");
      const octets = Math.floor(Number(bits) / 8);
      if (!octets) return false;
      return ip.split(".").slice(0, octets).join(".") === network.split(".").slice(0, octets).join(".");
    }
    return ip === entry;
  });
}

function harden(response: NextResponse): NextResponse {
  response.headers.set("X-Robots-Tag", "noindex, nofollow, noarchive");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Cache-Control", "no-store, max-age=0");
  return response;
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (!ipAllowed(request)) {
    return harden(new NextResponse("Not found", { status: 404 }));
  }

  if (SIGN_IN_PATHS.has(pathname) || !PROTECTED.test(pathname)) {
    return harden(NextResponse.next());
  }

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const key = process.env.AUTH_SECRET ? new TextEncoder().encode(process.env.AUTH_SECRET) : null;

  if (token && key) {
    try {
      const { payload } = await jwtVerify(token, key);
      if (payload.stage === "full") return harden(NextResponse.next());
    } catch {
      /* fall through to the sign-in redirect */
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = "/member-login";
  url.search = `?next=${encodeURIComponent(pathname)}`;
  return harden(NextResponse.redirect(url));
}

export const config = {
  matcher: ["/admin/:path*", "/member-login"],
};
