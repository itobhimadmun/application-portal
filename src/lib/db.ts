import postgres from "postgres";

/**
 * A single lazily-created Postgres client.
 *
 * On serverless platforms every invocation may run in a fresh isolate, so the
 * client is cached on `globalThis` and kept to a small pool. `prepare: false`
 * keeps it compatible with transaction-mode poolers (Neon / Supabase / PgBouncer).
 */
declare global {
  // eslint-disable-next-line no-var
  var __portalSql: ReturnType<typeof postgres> | undefined;
}

function create() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error(
      "DATABASE_URL is not set. Copy .env.example to .env and point it at a Postgres database."
    );
  }
  return postgres(url, {
    max: process.env.VERCEL ? 1 : 5,
    idle_timeout: 20,
    connect_timeout: 15,
    prepare: false,
    ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : "require",
  });
}

export const sql: ReturnType<typeof postgres> =
  globalThis.__portalSql ?? (globalThis.__portalSql = create());

export async function isDatabaseReady(): Promise<boolean> {
  try {
    await sql`SELECT 1 FROM applications LIMIT 1`;
    return true;
  } catch {
    return false;
  }
}
