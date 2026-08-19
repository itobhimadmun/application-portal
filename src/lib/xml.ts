/**
 * A very small XML reader, enough for the OOXML subset a .docx contains.
 *
 * A full parser would be overkill here: WordprocessingML has no CDATA, no
 * entities beyond the standard five, and no mixed-content surprises. What it
 * does have is a great many elements, so the reader stays permissive — an
 * unexpected tag simply becomes a node with children.
 */

export type XNode = {
  tag: string;
  attrs: Record<string, string>;
  children: XNode[];
  /** Character data directly inside this element. */
  text: string;
};

function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code: string) => String.fromCodePoint(parseInt(code, 16)))
    .replace(/&amp;/g, "&");
}

function parseAttrs(source: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  for (const match of source.matchAll(/([\w:.-]+)\s*=\s*"([^"]*)"|([\w:.-]+)\s*=\s*'([^']*)'/g)) {
    const name = match[1] ?? match[3];
    const value = match[2] ?? match[4] ?? "";
    attrs[name] = decodeEntities(value);
  }
  return attrs;
}

const node = (tag: string, attrs: Record<string, string> = {}): XNode => ({
  tag, attrs, children: [], text: "",
});

/** Parse an XML document into a tree. Returns a synthetic root holding the top-level element. */
export function parseXml(xml: string): XNode {
  const root = node("#root");
  const stack: XNode[] = [root];
  const tagPattern = /<(\/)?([\w:.-]+)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/)?>|<\?[\s\S]*?\?>|<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<![\s\S]*?>/g;

  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = tagPattern.exec(xml)) !== null) {
    const parent = stack[stack.length - 1];
    if (match.index > cursor) {
      parent.text += decodeEntities(xml.slice(cursor, match.index));
    }
    cursor = tagPattern.lastIndex;

    // Comments, processing instructions and doctypes carry nothing we need.
    if (!match[2]) continue;

    const [, closing, tag, attrSource, selfClosing] = match;

    if (closing) {
      for (let i = stack.length - 1; i > 0; i--) {
        if (stack[i].tag === tag) {
          stack.length = i;
          break;
        }
      }
      continue;
    }

    const element = node(tag, attrSource ? parseAttrs(attrSource) : {});
    parent.children.push(element);
    if (!selfClosing) stack.push(element);
  }

  return root;
}

/** First direct child with this tag name. */
export function child(parent: XNode | undefined, tag: string): XNode | undefined {
  return parent?.children.find((c) => c.tag === tag);
}

/** All direct children with this tag name. */
export function children(parent: XNode | undefined, tag: string): XNode[] {
  return parent?.children.filter((c) => c.tag === tag) ?? [];
}

/** First descendant with this tag name, breadth-first. */
export function descendant(parent: XNode | undefined, tag: string): XNode | undefined {
  if (!parent) return undefined;
  const queue = [...parent.children];
  while (queue.length) {
    const current = queue.shift()!;
    if (current.tag === tag) return current;
    queue.push(...current.children);
  }
  return undefined;
}

/** The `w:val` attribute of a child element, if present. */
export function val(parent: XNode | undefined, tag: string): string | undefined {
  return child(parent, tag)?.attrs["w:val"];
}

/**
 * Word treats `<w:b/>` as on and `<w:b w:val="0"/>` as off; an absent element
 * means "inherit". Returns undefined for inherit so styles can cascade.
 */
export function toggle(parent: XNode | undefined, tag: string): boolean | undefined {
  const element = child(parent, tag);
  if (!element) return undefined;
  const value = element.attrs["w:val"];
  if (value === undefined) return true;
  return value !== "0" && value !== "false" && value !== "off";
}

/** Numeric attribute, returning undefined rather than NaN. */
export function num(value: string | undefined): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
