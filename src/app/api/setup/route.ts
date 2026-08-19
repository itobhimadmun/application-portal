import { NextResponse, type NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { sql } from "@/lib/db";
import { ensureSchema } from "@/lib/migrate";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * ONE-TIME BOOTSTRAP ENDPOINT
 * ---------------------------
 * Applies db/schema.sql and creates the first administrator, for deployments
 * where you cannot reach the database directly from a laptop (managed Postgres
 * behind a private network, restricted egress, etc.).
 *
 * It is inert unless SETUP_TOKEN is set, and it refuses to run once an
 * administrator already exists. Delete SETUP_TOKEN from the environment after
 * the first successful call — the route then returns 404 forever.
 *
 *   GET /api/setup?token=<SETUP_TOKEN>          → schema + first admin
 *   GET /api/setup?token=<SETUP_TOKEN>&seed=1   → also load the sample library
 */
export async function GET(request: NextRequest) {
  const expected = process.env.SETUP_TOKEN;
  if (!expected) return new NextResponse("Not found", { status: 404 });

  const provided = request.nextUrl.searchParams.get("token") ?? "";
  if (provided.length !== expected.length || provided !== expected) {
    return new NextResponse("Not found", { status: 404 });
  }

  const log: string[] = [];
  try {
    const schema = await ensureSchema();
    log.push(schema.applied ? `schema applied (${schema.version})` : "schema already current");

    const [existing] = await sql<{ count: number }[]>`
      SELECT count(*)::int AS count FROM admin_users`;

    if (existing.count > 0) {
      log.push(`administrator already exists (${existing.count}) — skipped`);
    } else {
      const email = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
      const password = process.env.ADMIN_PASSWORD || "";
      const name = process.env.ADMIN_NAME || "Portal Administrator";
      if (!email || password.length < 8) {
        return NextResponse.json(
          { ok: false, log, error: "Set ADMIN_EMAIL and an ADMIN_PASSWORD of 8+ characters, then retry." },
          { status: 400 }
        );
      }
      await sql`
        INSERT INTO admin_users (email, name, password_hash, role)
        VALUES (${email}, ${name}, ${await bcrypt.hash(password, 10)}, 'admin')`;
      log.push(`administrator created: ${email}`);
    }

    if (request.nextUrl.searchParams.get("seed") === "1") {
      const { seedSampleLibrary } = await import("@/lib/seed-data");
      const summary = await seedSampleLibrary();
      log.push(`sample library loaded: ${summary}`);
    }

    return NextResponse.json({
      ok: true,
      log,
      next: "Sign in at /admin/login, then delete the SETUP_TOKEN environment variable.",
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, log, error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
