/**
 * Loads the sample library from the shared definition in src/lib/seed-data.ts.
 *
 *   npm run db:seed
 */
import "dotenv/config";
import { sql } from "../lib/db";
import { seedSampleLibrary } from "../lib/seed-data";

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");
  console.log("→ seeding sample library…");
  const summary = await seedSampleLibrary();
  console.log(`✓ seeded ${summary}`);
  await sql.end();
}

main().catch((error) => {
  console.error("✗ seed failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
