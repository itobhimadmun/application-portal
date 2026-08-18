import { devanagariToLatin, hasDevanagari, normalizeDigits } from "./translit";

export function slugify(input: string): string {
  const latin = hasDevanagari(input) ? devanagariToLatin(input) : input;
  return normalizeDigits(latin)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "service";
}
