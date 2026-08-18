/**
 * Creates the database schema and the first administrator account.
 * Safe to run more than once.
 *
 *   npm run db:setup
 */
import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import postgres from "postgres";
import bcrypt from "bcryptjs";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");

  const sql = postgres(url, {
    ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : "require",
    prepare: false,
    max: 1,
  });

  const schema = readFileSync(join(process.cwd(), "db", "schema.sql"), "utf8");
  console.log("→ applying schema…");
  await sql.unsafe(schema);
  console.log("✓ schema ready");

  const email = (process.env.ADMIN_EMAIL || "admin@example.gov.np").toLowerCase();
  const password = process.env.ADMIN_PASSWORD || "ChangeMe123!";
  const name = process.env.ADMIN_NAME || "Portal Administrator";

  const [existing] = await sql`SELECT id FROM admin_users WHERE lower(email) = ${email}`;
  if (existing) {
    console.log(`✓ administrator already exists: ${email}`);
  } else {
    await sql`
      INSERT INTO admin_users (email, name, password_hash, role)
      VALUES (${email}, ${name}, ${await bcrypt.hash(password, 10)}, 'admin')`;
    console.log(`✓ administrator created: ${email}`);
    if (!process.env.ADMIN_PASSWORD) {
      console.log(`  temporary password: ${password}  ← change it after the first login`);
    }
  }

  await sql.end();
}

main().catch((error) => {
  console.error("✗ setup failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
