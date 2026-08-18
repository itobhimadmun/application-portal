/** Drops every portal table. Destructive — development use only. */
import "dotenv/config";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const sql = postgres(url, {
    ssl: url.includes("localhost") || url.includes("127.0.0.1") ? false : "require",
    prepare: false, max: 1,
  });

  await sql.unsafe(`
    DROP TABLE IF EXISTS application_files, application_documents, application_steps,
      application_wards, applications, categories, sections, wards, settings,
      search_log, admin_users CASCADE;`);
  console.log("✓ all portal tables dropped");
  await sql.end();
}

main().catch((error) => {
  console.error("✗ reset failed:", error);
  process.exit(1);
});
