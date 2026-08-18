import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { sql } from "./db";

export const SESSION_COOKIE = "portal_session";
const MAX_AGE = 60 * 60 * 8; // 8 hours

export type SessionUser = {
  id: number;
  email: string;
  name: string;
  role: "admin" | "editor";
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

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({ email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(String(user.id))
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secret());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const store = await cookies();
    const token = store.get(SESSION_COOKIE)?.value;
    if (!token) return null;
    const { payload } = await jwtVerify(token, secret());
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

export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  const rows = await sql<
    { id: number; email: string; name: string; password_hash: string; role: string; is_active: boolean }[]
  >`SELECT id, email, name, password_hash, role, is_active
      FROM admin_users WHERE lower(email) = lower(${email}) LIMIT 1`;

  const row = rows[0];
  if (!row || !row.is_active) return null;
  if (!(await verifyPassword(password, row.password_hash))) return null;

  await sql`UPDATE admin_users SET last_login_at = now() WHERE id = ${row.id}`;
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role === "admin" ? "admin" : "editor",
  };
}
