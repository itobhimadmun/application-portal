import JSZip from "jszip";
import { BLANK } from "./docx-blank";

/**
 * Turns an uploaded .docx into a fillable form.
 *
 * An administrator writes placeholders directly in the Word file, e.g.
 *
 *     म {{name}}, वडा नं. {{ward}} बस्ने, ...
 *
 * The portal reads those placeholders out of the file, the administrator gives
 * each one a Nepali/English label, and a citizen then fills them online and
 * downloads the completed document — same layout, same letterhead, same wording.
 *
 * Word fragments a typed phrase across several <w:r> runs, so "{{name}}" often
 * does not exist as one contiguous string in the XML. Every paragraph that
 * contains a placeholder is therefore flattened into its first run before the
 * substitution, which is what makes the match reliable.
 */

export const PLACEHOLDER = /\{\{\s*([A-Za-z0-9_.\-]{1,60})\s*\}\}/g;
const TEXT_PARTS = ["word/document.xml"];

function xmlParts(zip: JSZip): string[] {
  const extra = Object.keys(zip.files).filter(
    (name) => /^word\/(header|footer)\d*\.xml$/.test(name)
  );
  return [...TEXT_PARTS, ...extra].filter((name) => zip.file(name));
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function decodeXml(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

/**
 * Rewrite each <w:p> that holds a placeholder, using `transform` on its text.
 * With `always`, the paragraph is collapsed even when the text is unchanged —
 * that is the flattening pass on its own.
 */
function rewriteParagraphs(
  xml: string,
  transform: (text: string) => string,
  always = false
): string {
  return xml.replace(/<w:p(?:\s[^>]*)?>[\s\S]*?<\/w:p>/g, (paragraph) => {
    const runs = [...paragraph.matchAll(/<w:t(?:\s[^>]*)?>([\s\S]*?)<\/w:t>/g)];
    if (!runs.length) return paragraph;

    const joined = decodeXml(runs.map((m) => m[1]).join(""));
    if (!joined.includes("{{")) return paragraph;

    const replaced = transform(joined);
    if (replaced === joined && !always) return paragraph;

    let index = 0;
    return paragraph.replace(/<w:t(?:\s[^>]*)?>[\s\S]*?<\/w:t>/g, () => {
      const body = index === 0 ? escapeXml(replaced) : "";
      index += 1;
      return `<w:t xml:space="preserve">${body}</w:t>`;
    });
  });
}

/**
 * Collapse every placeholder-bearing paragraph into its first run, without
 * changing any text. The HTML renderer needs this too: it can only wrap a
 * placeholder in a span once the placeholder exists as one contiguous string.
 */
export function flattenPlaceholderParagraphs(xml: string): string {
  return rewriteParagraphs(xml, (text) => text, true);
}

/**
 * Produce a copy of the template with every placeholder replaced.
 *
 * A placeholder with no value becomes the ruled line for that field, so the
 * same function serves both jobs: the citizen's completed download, and the
 * blank copy someone prints to fill in with a pen. Either way the finished
 * file never contains `{{...}}`.
 */
export async function fillDocxTemplate(
  buffer: Buffer,
  values: Record<string, string>,
  rules: Record<string, string> = {}
): Promise<Buffer> {
  const zip = await JSZip.loadAsync(buffer);

  for (const part of xmlParts(zip)) {
    const xml = await zip.file(part)!.async("string");
    const filled = rewriteParagraphs(xml, (text) =>
      text.replace(PLACEHOLDER, (whole, key: string) => {
        const value = values[key];
        return value === undefined || value === "" ? rules[key] ?? BLANK : value;
      })
    );
    zip.file(part, filled);
  }

  return zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
}

export function isDocx(filename: string, mime: string): boolean {
  return (
    filename.toLowerCase().endsWith(".docx") ||
    mime === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  );
}
