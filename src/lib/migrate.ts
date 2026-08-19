import { sql } from "@/lib/db";
import { SCHEMA_SQL, SCHEMA_VERSION } from "@/lib/schema-sql";

/**
 * Self-applying schema.
 * ---------------------
 * db/schema.sql is fully idempotent, so the safest deployment story is for the
 * application to apply it itself instead of relying on somebody remembering to
 * run a migration. One cheap version lookup guards the cold start; the schema
 * only runs when the stored marker does not match the current file.
 *
 * A Postgres advisory lock keeps concurrent serverless instances from applying
 * the same DDL at the same time.
 */

const LOCK_KEY = 728_311_045; // arbitrary, stable for this application

declare global {
  // eslint-disable-next-line no-var
  var __portalSchemaReady: Promise<{ applied: boolean; version: string }> | undefined;
}

async function apply(): Promise<{ applied: boolean; version: string }> {
  const current = await currentVersion();
  if (current === SCHEMA_VERSION) return { applied: false, version: SCHEMA_VERSION };

  await sql`SELECT pg_advisory_lock(${LOCK_KEY})`;
  try {
    // Re-check inside the lock: another instance may have just finished.
    if ((await currentVersion()) === SCHEMA_VERSION) {
      return { applied: false, version: SCHEMA_VERSION };
    }
    await sql.unsafe(SCHEMA_SQL);
    await sql`
      INSERT INTO settings (key, value, updated_at)
      VALUES ('schema.version', ${SCHEMA_VERSION}, now())
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`;
    return { applied: true, version: SCHEMA_VERSION };
  } finally {
    await sql`SELECT pg_advisory_unlock(${LOCK_KEY})`;
  }
}

/** Returns the stored schema marker, or null when the portal is brand new. */
async function currentVersion(): Promise<string | null> {
  try {
    const rows = await sql<{ value: string }[]>`
      SELECT value FROM settings WHERE key = 'schema.version' LIMIT 1`;
    return rows[0]?.value ?? null;
  } catch {
    return null; // settings table does not exist yet
  }
}

/**
 * Ensures the database matches db/schema.sql. Runs at most once per process;
 * callers may await it freely.
 */
export function ensureSchema(): Promise<{ applied: boolean; version: string }> {
  if (!process.env.DATABASE_URL) {
    return Promise.resolve({ applied: false, version: "" });
  }
  if (!globalThis.__portalSchemaReady) {
    globalThis.__portalSchemaReady = apply().catch((error) => {
      // Never take the site down because a migration could not run — the page
      // level setup notice already explains what is missing.
      globalThis.__portalSchemaReady = undefined;
      throw error;
    });
  }
  return globalThis.__portalSchemaReady;
}
