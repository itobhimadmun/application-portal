/**
 * Runs once per server instance before the first request is handled, including
 * on every serverless cold start. Used to bring the database schema up to date
 * so a deployment never needs a manual migration step.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  try {
    const { ensureSchema } = await import("@/lib/migrate");
    const result = await ensureSchema();
    if (result.applied) console.log(`[portal] schema applied (${result.version})`);
  } catch (error) {
    console.error("[portal] schema check failed:", error);
  }
}
