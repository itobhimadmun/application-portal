import type { TemplateField } from "./types";

/**
 * The ruled line a citizen writes on.
 *
 * A form that is downloaded rather than filled online has to look like the
 * paper it is about to become: a dotted rule wide enough to write a name on,
 * never a `{{placeholder}}`. The rule is sized by what the field holds, because
 * one length cannot serve both a ward number sitting mid-sentence and an
 * address on a line of its own — a rule long enough for the address would wrap
 * the sentence, and one short enough for the number would be unwritable.
 *
 * This module stays free of JSZip so the browser can import it too.
 */

const LENGTHS: Record<TemplateField["type"], number> = {
  number: 10,
  date: 16,
  text: 26,
  textarea: 48,
};

/** A dotted rule of the right width for a field of this type. */
export function blankRule(type?: TemplateField["type"] | string): string {
  const length = LENGTHS[(type ?? "text") as TemplateField["type"]] ?? LENGTHS.text;
  return ".".repeat(length);
}

/** Rules keyed by placeholder name, for filling a whole document at once. */
export function blankRules(fields: TemplateField[]): Record<string, string> {
  return Object.fromEntries(fields.map((field) => [field.key, blankRule(field.type)]));
}

/** Used where the field's type is not known, and on screen before typing. */
export const BLANK = blankRule("text");
