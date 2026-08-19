import { sql } from "./db";

/**
 * Images that belong to the portal rather than to any one application — the
 * municipality's emblem, today.
 *
 * They live in their own table because `application_files` rows hang off an
 * application, and because an emblem needs none of that machinery: no
 * placeholders, no preview, no blank copy. It is a small image served from a
 * stable URL and cached hard.
 */

export type BrandingAsset = { mime: string; data: Buffer; updatedAt: Date };

export async function readBrandingAsset(key: string): Promise<BrandingAsset | null> {
  const rows = await sql<{ mime: string; data: Buffer; updated_at: Date }[]>`
    SELECT mime, data, updated_at FROM branding_assets WHERE key = ${key} LIMIT 1`;
  const row = rows[0];
  return row ? { mime: row.mime, data: Buffer.from(row.data), updatedAt: row.updated_at } : null;
}

/**
 * Store an image and return the URL to point at it. The timestamp in the query
 * string is what makes a replacement show up: the response is cached for a
 * year, so without it a browser would keep the old emblem indefinitely.
 */
export async function saveBrandingAsset(
  key: string, mime: string, data: Buffer
): Promise<string> {
  const [row] = await sql<{ updated_at: Date }[]>`
    INSERT INTO branding_assets (key, mime, data, updated_at)
    VALUES (${key}, ${mime}, ${data}, now())
    ON CONFLICT (key) DO UPDATE
      SET mime = EXCLUDED.mime, data = EXCLUDED.data, updated_at = now()
    RETURNING updated_at`;

  return `/api/branding/${key}?v=${row.updated_at.getTime()}`;
}

export async function deleteBrandingAsset(key: string): Promise<void> {
  await sql`DELETE FROM branding_assets WHERE key = ${key}`;
}
