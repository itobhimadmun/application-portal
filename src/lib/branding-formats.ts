/**
 * What counts as an emblem, and how large it may be.
 *
 * Separate from `branding.ts` because the upload form needs these in the
 * browser, and `branding.ts` reaches for the database — importing it from a
 * client component would drag the Postgres driver into the page bundle.
 */

export const LOGO_KEY = "logo";

/** An emblem is a few kilobytes; anything near this is the wrong file. */
export const MAX_BRANDING_BYTES = 512 * 1024;

const ALLOWED: { ext: string[]; mime: string }[] = [
  { ext: [".svg"], mime: "image/svg+xml" },
  { ext: [".png"], mime: "image/png" },
  { ext: [".jpg", ".jpeg"], mime: "image/jpeg" },
  { ext: [".webp"], mime: "image/webp" },
];

export const BRANDING_ACCEPT = ALLOWED.flatMap((entry) => entry.ext).join(",");

/** The image type, from the browser's guess or else the file name. */
export function imageMime(filename: string, mime: string): string | null {
  const lower = filename.toLowerCase();
  for (const entry of ALLOWED) {
    if (entry.mime === mime) return entry.mime;
    if (entry.ext.some((ext) => lower.endsWith(ext))) return entry.mime;
  }
  return null;
}
