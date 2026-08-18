import { cookies, headers } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { sql } from "./db";

export const SESSION_COOKIE = "portal_session";
export const PENDING_COOKIE = "portal_pending";

const MAX_AGE = 60 * 60 * 8;      // full session: 8 hours
const PENDING_MAX_AGE = 60 * 5;   // half-authenticated: 5 minutes

/** Failed password attempts before an account is temporarily locked. */
export const MAX_FAILED_ATTEMPTS = 5;
export const LOCKOUT_MINUTES = 15;

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "editor";
};

export type AdminRow = {
  id: number; email: string; name: string; password_hash: string; role: string;
  is_active: boolean; totp_secret: string | null; totp_enabled: boolean;
  failed_attempts: number; locked_until: string | null;
};

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    throw new Error("AUTH_SECRET must be set to a random string of at least 16 characters.");
  }
  return new TextEncoder().encode(value);
}

export function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Best-effort client IP, used only for throttling and the audit trail. */
export async function clientIp(): Promise<string> {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  return (forwarded?.split(",")[0] ?? store.get("x-real-ip") ?? "").trim();
}

/* ------------------------------------------------------------- full session */

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ email: user.email, name: user.name, role: user.role, stage: "full" })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: MAX_AGE,
  });
  store.delete(PENDING_COOKIE);
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(PENDING_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    if (payload.stage !== "full") return null;
    return {
      id: Number(payload.sub),
      email: String(payload.email ?? ""),
      name: String(payload.name ?? ""),
      role: payload.role === "admin" ? "admin" : "editor",
    };
  } catch {
    return null;
  }
}

/* ---------------------------------------------------------- pending session */
/** Issued after a correct password, before the second factor is proven. */

export type PendingStage = "totp" | "enroll";

export async function createPendingSession(userId: number, stage: PendingStage): Promise<void> {
  const token = await new SignJWT({ stage })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(userId))
    .setIssuedAt()
    .setExpirationTime(`${PENDING_MAX_AGE}s`)
    .sign(secret());

  const store = await cookies();
  store.set(PENDING_COOKIE, token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production",
    path: "/", maxAge: PENDING_MAX_AGE,
  });
}

export async function getPendingSession(): Promise<{ userId: number; stage: PendingStage } | null> {
  try {
    const store = await cookies();
    const token = store.get(PENDING_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
    const stage = payload.stage === "enroll" ? "enroll" : payload.stage === "totp" ? "totp" : null;
    if (!stage) return null;
    return { userId: Number(payload.sub), stage };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------- credentials */

export async function findAdminByEmail(email: string): Promise<AdminRow | null> {
  const rows = await sql<AdminRow[]>`
    SELECT id, email, name, password_hash, role, is_active,
           totp_secret, totp_enabled, failed_attempts, locked_until
      FROM admin_users WHERE lower(email) = lower(${email}) LIMIT 1`;
  return rows[0] ?? null;
}

export async function findAdminById(id: number): Promise<AdminRow | null> {
  const rows = await sql<AdminRow[]>`
    SELECT id, email, name, password_hash, role, is_active,
           totp_secret, totp_enabled, failed_attempts, locked_until
      FROM admin_users WHERE id = ${id} LIMIT 1`;
  return rows[0] ?? null;
}

export function isLocked(row: AdminRow): boolean {
  return Boolean(row.locked_until && new Date(row.locked_until).getTime() > Date.now());
}

export async function recordFailure(row: AdminRow): Promise<void> {
  const attempts = row.failed_attempts + 1;
  if (attempts >= MAX_FAILED_ATTEMPTS) {
    await sql`UPDATE admin_users
                 SET failed_attempts = 0,
                     locked_until = now() + (${LOCKOUT_MINUTES} || ' minutes')::interval
               WHERE id = ${row.id}`;
  } else {
    await sql`UPDATE admin_users SET failed_attempts = ${attempts} WHERE id = ${row.id}`;
  }
}

export async function recordSuccess(id: number): Promise<void> {
  await sql`UPDATE admin_users
               SET failed_attempts = 0, locked_until = NULL, last_login_at = now()
             WHERE id = ${id}`;
}

export async function logAttempt(email: string, ip: string, successful: boolean): Promise<void> {
  try {
    await sql`INSERT INTO login_attempts (email, ip, successful)
              VALUES (${email.slice(0, 160)}, ${ip.slice(0, 64)}, ${successful})`;
  } catch {
    /* the audit trail must never block a login */
  }
}

/** Throttle by source IP as well as by account, so guessing many emails is slow. */
export async function tooManyAttemptsFromIp(ip: string): Promise<boolean> {
  if (!ip) return false;
  try {
    const [row] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM login_attempts
       WHERE ip = ${ip} AND NOT successful AND created_at > now() - interval '15 minutes'`;
    return (row?.count ?? 0) >= 20;
  } catch {
    return false;
  }
}

export const sessionUser = getSessionUser;
