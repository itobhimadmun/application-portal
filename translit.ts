/**
 * Devanagari → Latin transliteration and search "skeleton" normalisation.
 *
 * The portal must find "सिफारिस" when a citizen types "sifaris", "sifarish"
 * or "sipharis". We solve that without any AI service by storing a romanised
 * copy of every Nepali string in the search index and normalising both sides
 * of the comparison into a forgiving skeleton form.
 */

const CONSONANTS: Record<string, string> = {
  "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "n",
  "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "n",
  "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
  "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
  "प": "p", "फ": "ph", "ब": "b", "भ": "bh", "म": "m",
  "य": "y", "र": "r", "ल": "l", "व": "w", "ळ": "l",
  "श": "sh", "ष": "sh", "स": "s", "ह": "h",
  "क़": "k", "ख़": "kh", "ग़": "g", "ज़": "z", "ड़": "r", "ढ़": "rh", "फ़": "f",
};

const INDEPENDENT_VOWELS: Record<string, string> = {
  "अ": "a", "आ": "aa", "इ": "i", "ई": "ee", "उ": "u", "ऊ": "oo",
  "ऋ": "ri", "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au",
};

const MATRAS: Record<string, string> = {
  "ा": "aa", "ि": "i", "ी": "ee", "ु": "u", "ू": "oo", "ृ": "ri",
  "े": "e", "ै": "ai", "ो": "o", "ौ": "au",
};

const MARKS: Record<string, string> = {
  "ं": "n", "ँ": "n", "ः": "h", "ऽ": "", "़": "",
};

const DIGITS: Record<string, string> = {
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
  "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
};

const HALANT = "्";

export function hasDevanagari(input: string): boolean {
  return /[ऀ-ॿ]/.test(input);
}

/** Rough phonetic romanisation of a Devanagari string. */
export function devanagariToLatin(input: string): string {
  let out = "";
  const chars = Array.from(input);

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const next = chars[i + 1];

    if (CONSONANTS[ch]) {
      out += CONSONANTS[ch];
      // Implicit "a" unless a matra, halant or another mark follows.
      const suppressed = next === HALANT || (next !== undefined && MATRAS[next] !== undefined);
      if (!suppressed) out += "a";
      continue;
    }
    if (ch === HALANT) continue;
    if (MATRAS[ch]) { out += MATRAS[ch]; continue; }
    if (INDEPENDENT_VOWELS[ch]) { out += INDEPENDENT_VOWELS[ch]; continue; }
    if (MARKS[ch] !== undefined) { out += MARKS[ch]; continue; }
    if (DIGITS[ch]) { out += DIGITS[ch]; continue; }
    out += ch;
  }
  return out;
}

/** Convert Devanagari digits inside any string to ASCII digits. */
export function normalizeDigits(input: string): string {
  return input.replace(/[०-९]/g, (d) => DIGITS[d] ?? d);
}

/** ASCII digits → Devanagari, used for displaying numbers in Nepali. */
export function toNepaliDigits(input: string | number): string {
  const table = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];
  return String(input).replace(/[0-9]/g, (d) => table[Number(d)]);
}

/**
 * Collapse a Latin string into a forgiving comparison skeleton:
 * long/short vowels, sibilants, aspirates and b/v/w all merge together.
 */
export function skeleton(input: string): string {
  let s = input.toLowerCase();
  s = s.replace(/[^a-z0-9\s]/g, " ");
  s = s.replace(/chh/g, "ch");
  s = s.replace(/sh/g, "s");
  s = s.replace(/([bcdgjkpt])h/g, "$1");
  s = s.replace(/ph/g, "p");
  s = s.replace(/f/g, "p");
  s = s.replace(/[vw]/g, "b");
  s = s.replace(/z/g, "j");
  s = s.replace(/x/g, "ks");
  s = s.replace(/c(?![h])/g, "k");
  s = s.replace(/aa+/g, "a");
  s = s.replace(/ee+|ii+/g, "i");
  s = s.replace(/oo+|uu+/g, "u");
  s = s.replace(/(.)\1+/g, "$1");
  return s.replace(/\s+/g, " ").trim();
}

/**
 * All searchable variants of a term: the raw text, its romanisation and the
 * skeleton of both. Used when building the index and when parsing a query.
 */
export function searchVariants(input: string): string[] {
  const raw = normalizeDigits(input).toLowerCase().trim();
  if (!raw) return [];
  const variants = new Set<string>([raw]);
  if (hasDevanagari(input)) {
    const latin = devanagariToLatin(input).toLowerCase();
    variants.add(latin);
    variants.add(skeleton(latin));
  } else {
    variants.add(skeleton(raw));
  }
  return [...variants].filter(Boolean);
}

/** Build the flattened text blob stored in `applications.search_index`. */
export function buildSearchIndex(parts: (string | null | undefined)[]): string {
  const tokens = new Set<string>();
  for (const part of parts) {
    if (!part) continue;
    for (const piece of String(part).split(/[\s,;/|]+/)) {
      for (const v of searchVariants(piece)) tokens.add(v);
    }
    for (const v of searchVariants(String(part))) tokens.add(v);
  }
  return [...tokens].join(" ");
}
