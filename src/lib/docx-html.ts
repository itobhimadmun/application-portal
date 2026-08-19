import JSZip from "jszip";
import { BLANK } from "./docx-blank";
import { flattenPlaceholderParagraphs, PLACEHOLDER } from "./docx-template";
import {
  child, children, descendant, num, parseXml, toggle, val, type XNode,
} from "./xml";

/**
 * Renders a .docx into HTML that looks like the printed page.
 *
 * The portal is a library of official application forms, so the on-screen
 * preview has to resemble the paper it will become: same margins, same
 * alignment, same tables, same letterhead. Word's own semantics are therefore
 * followed fairly literally — twips to points, half-points to points, EMUs to
 * points — rather than mapped onto tidy semantic HTML, which would throw away
 * exactly the formatting that makes the document official.
 *
 * Every `{{placeholder}}` becomes a `<span data-field="key">`, so the browser
 * can drop the citizen's answers straight into position as they type.
 */

export type DocxPage = {
  /** Page box in points, taken from the document's section properties. */
  width: number; height: number;
  marginTop: number; marginRight: number; marginBottom: number; marginLeft: number;
};

export type DocxRender = {
  html: string;
  page: DocxPage;
  /** Placeholder keys in the order they appear. */
  fields: string[];
};

const TWIP = 20;            // twips per point
const EMU = 12700;          // EMUs per point
const HALF_POINT = 2;       // w:sz is in half-points

const A4: DocxPage = {
  width: 595, height: 842,
  marginTop: 72, marginRight: 72, marginBottom: 72, marginLeft: 72,
};

// --------------------------------------------------------------------- utils

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const round = (value: number): number => Math.round(value * 100) / 100;

function css(declarations: Record<string, string | undefined>): string {
  const body = Object.entries(declarations)
    .filter(([, value]) => value !== undefined && value !== "")
    .map(([property, value]) => `${property}:${value}`)
    .join(";");
  return body ? ` style="${escapeHtml(body)}"` : "";
}

const ALIGNMENT: Record<string, string> = {
  left: "left", start: "left", right: "right", end: "right",
  center: "center", both: "justify", distribute: "justify",
};

/**
 * Word records fonts per script. Nepali sits in the complex-script slot, so
 * `w:cs` is usually the meaningful one; the Latin face is kept as a fallback.
 * Legacy non-Unicode Nepali faces (Preeti and friends) are passed through
 * unchanged — those documents only render correctly where the font is
 * installed, and substituting something else would not help.
 */
function fontFamily(rPr: XNode | undefined): string | undefined {
  const fonts = child(rPr, "w:rFonts");
  if (!fonts) return undefined;
  const names = [fonts.attrs["w:cs"], fonts.attrs["w:ascii"], fonts.attrs["w:hAnsi"]]
    .filter((name): name is string => Boolean(name) && name !== "Calibri");
  if (!names.length) return undefined;
  const unique = [...new Set(names)];
  const stack = unique.map((name) => `'${name.replace(/'/g, "")}'`);
  if (!unique.includes("Noto Sans Devanagari")) stack.push("'Noto Sans Devanagari'");
  return `${stack.join(",")},sans-serif`;
}

function colour(value: string | undefined): string | undefined {
  if (!value || value === "auto") return undefined;
  return /^[0-9a-fA-F]{6}$/.test(value) ? `#${value}` : undefined;
}

// -------------------------------------------------------------------- styles

type Formatting = {
  bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean;
  size?: number; colour?: string; family?: string; caps?: boolean;
  align?: string; indentLeft?: number; indentRight?: number; firstLine?: number;
  spaceBefore?: number; spaceAfter?: number; lineHeight?: string;
};

function readRunFormatting(rPr: XNode | undefined): Formatting {
  if (!rPr) return {};
  const underline = val(rPr, "w:u");
  return {
    bold: toggle(rPr, "w:b"),
    italic: toggle(rPr, "w:i"),
    strike: toggle(rPr, "w:strike"),
    underline: underline === undefined ? undefined : underline !== "none",
    size: num(val(rPr, "w:sz")) !== undefined ? num(val(rPr, "w:sz"))! / HALF_POINT : undefined,
    colour: colour(val(rPr, "w:color")),
    family: fontFamily(rPr),
    caps: toggle(rPr, "w:caps"),
  };
}

function readParagraphFormatting(pPr: XNode | undefined): Formatting {
  if (!pPr) return {};
  const indent = child(pPr, "w:ind");
  const spacing = child(pPr, "w:spacing");
  const hanging = num(indent?.attrs["w:hanging"]);
  const firstLine = num(indent?.attrs["w:firstLine"]);

  let lineHeight: string | undefined;
  const line = num(spacing?.attrs["w:line"]);
  if (line !== undefined) {
    const rule = spacing?.attrs["w:lineRule"];
    lineHeight = rule === "exact" || rule === "atLeast"
      ? `${round(line / TWIP)}pt`
      : `${round(line / 240)}`;
  }

  return {
    align: ALIGNMENT[val(pPr, "w:jc") ?? ""],
    indentLeft: num(indent?.attrs["w:left"] ?? indent?.attrs["w:start"]),
    indentRight: num(indent?.attrs["w:right"] ?? indent?.attrs["w:end"]),
    firstLine: hanging !== undefined ? -hanging : firstLine,
    spaceBefore: num(spacing?.attrs["w:before"]),
    spaceAfter: num(spacing?.attrs["w:after"]),
    lineHeight,
    ...readRunFormatting(child(pPr, "w:rPr")),
  };
}

/** Later definitions win; `undefined` means "inherit", so it never overwrites. */
function merge(...layers: Formatting[]): Formatting {
  const result: Formatting = {};
  for (const layer of layers) {
    for (const [key, value] of Object.entries(layer)) {
      if (value !== undefined) (result as Record<string, unknown>)[key] = value;
    }
  }
  return result;
}

type StyleEntry = {
  formatting: Formatting;
  basedOn?: string;
  /** Table styles keep their borders here — `Table Grid` and friends. */
  tableBorders?: XNode;
  /** List styles carry the numbering reference, not the paragraph. */
  numId?: string;
  level?: number;
};

type StyleSheet = {
  defaults: Formatting;
  byId: Map<string, StyleEntry>;
};

function readStyles(xml: string | undefined): StyleSheet {
  const sheet: StyleSheet = { defaults: {}, byId: new Map() };
  if (!xml) return sheet;

  const root = child(parseXml(xml), "w:styles");
  const docDefaults = child(root, "w:docDefaults");
  sheet.defaults = merge(
    readRunFormatting(child(child(docDefaults, "w:rPrDefault"), "w:rPr")),
    readParagraphFormatting(child(child(docDefaults, "w:pPrDefault"), "w:pPr"))
  );

  for (const style of children(root, "w:style")) {
    const id = style.attrs["w:styleId"];
    if (!id) continue;
    const pPr = child(style, "w:pPr");
    const numPr = child(pPr, "w:numPr");
    sheet.byId.set(id, {
      basedOn: val(style, "w:basedOn"),
      formatting: merge(readParagraphFormatting(pPr), readRunFormatting(child(style, "w:rPr"))),
      tableBorders: child(child(style, "w:tblPr"), "w:tblBorders"),
      numId: val(numPr, "w:numId"),
      level: num(val(numPr, "w:ilvl")),
    });
  }
  return sheet;
}

/** Follow basedOn until a style in the chain supplies the property. */
function inherited<K extends keyof StyleEntry>(
  sheet: StyleSheet, id: string | undefined, key: K, depth = 0
): StyleEntry[K] | undefined {
  if (!id || depth > 8) return undefined;
  const entry = sheet.byId.get(id);
  if (!entry) return undefined;
  return entry[key] ?? inherited(sheet, entry.basedOn, key, depth + 1);
}

/** Walk the basedOn chain so an inherited style still contributes. */
function resolveStyle(sheet: StyleSheet, id: string | undefined, depth = 0): Formatting {
  if (!id || depth > 8) return {};
  const entry = sheet.byId.get(id);
  if (!entry) return {};
  return merge(resolveStyle(sheet, entry.basedOn, depth + 1), entry.formatting);
}

// ------------------------------------------------------------------ numbering

type ListLevel = { format: string; text: string; start: number };
type Numbering = Map<string, Map<number, ListLevel>>;

function readNumbering(xml: string | undefined): Numbering {
  const numbering: Numbering = new Map();
  if (!xml) return numbering;

  const root = child(parseXml(xml), "w:numbering");
  const abstract = new Map<string, Map<number, ListLevel>>();

  for (const definition of children(root, "w:abstractNum")) {
    const id = definition.attrs["w:abstractNumId"];
    const levels = new Map<number, ListLevel>();
    for (const level of children(definition, "w:lvl")) {
      const index = num(level.attrs["w:ilvl"]) ?? 0;
      levels.set(index, {
        format: val(level, "w:numFmt") ?? "decimal",
        text: val(level, "w:lvlText") ?? "%1.",
        start: num(val(level, "w:start")) ?? 1,
      });
    }
    if (id) abstract.set(id, levels);
  }

  for (const instance of children(root, "w:num")) {
    const id = instance.attrs["w:numId"];
    const target = val(instance, "w:abstractNumId");
    if (id && target && abstract.has(target)) numbering.set(id, abstract.get(target)!);
  }
  return numbering;
}

const DEVANAGARI = ["०", "१", "२", "३", "४", "५", "६", "७", "८", "९"];

function formatNumber(value: number, format: string): string {
  switch (format) {
    case "bullet": return "•";
    case "none": return "";
    case "lowerLetter": return String.fromCharCode(96 + ((value - 1) % 26) + 1);
    case "upperLetter": return String.fromCharCode(64 + ((value - 1) % 26) + 1);
    case "lowerRoman": return roman(value).toLowerCase();
    case "upperRoman": return roman(value);
    case "hindiNumbers":
    case "hindiVowels":
      return String(value).split("").map((digit) => DEVANAGARI[Number(digit)] ?? digit).join("");
    default: return String(value);
  }
}

function roman(value: number): string {
  const table: [number, string][] = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
  ];
  let remaining = value;
  let output = "";
  for (const [amount, numeral] of table) {
    while (remaining >= amount) { output += numeral; remaining -= amount; }
  }
  return output;
}

// --------------------------------------------------------------------- images

type Media = Map<string, string>; // relationship id → data URL

const IMAGE_TYPES: Record<string, string> = {
  png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
  gif: "image/gif", bmp: "image/bmp", svg: "image/svg+xml",
};

/** Total embedded image budget — a letterhead is small, a scanned page is not. */
const MEDIA_BUDGET = 3 * 1024 * 1024;

async function readMedia(zip: JSZip, relsPath: string): Promise<Media> {
  const media: Media = new Map();
  const relsFile = zip.file(relsPath);
  if (!relsFile) return media;

  const rels = child(parseXml(await relsFile.async("string")), "Relationships");
  let budget = MEDIA_BUDGET;

  for (const relationship of children(rels, "Relationship")) {
    const target = relationship.attrs.Target ?? "";
    const id = relationship.attrs.Id;
    if (!id || !/image/i.test(relationship.attrs.Type ?? "")) continue;

    const path = target.startsWith("/")
      ? target.slice(1)
      : `word/${target.replace(/^\.\.\//, "")}`;
    const file = zip.file(path);
    if (!file) continue;

    const extension = path.split(".").pop()?.toLowerCase() ?? "";
    const mime = IMAGE_TYPES[extension];
    if (!mime) continue;

    const bytes = await file.async("nodebuffer");
    if (bytes.length > budget) continue;
    budget -= bytes.length;
    media.set(id, `data:${mime};base64,${bytes.toString("base64")}`);
  }
  return media;
}

function renderImage(container: XNode, media: Media): string {
  const blip = descendant(container, "a:blip");
  const legacy = descendant(container, "v:imagedata");
  const id = blip?.attrs["r:embed"] ?? blip?.attrs["r:link"] ?? legacy?.attrs["r:id"];
  const source = id ? media.get(id) : undefined;
  if (!source) return "";

  const extent = descendant(container, "wp:extent");
  const width = num(extent?.attrs.cx);
  const height = num(extent?.attrs.cy);

  return `<img src="${source}" alt=""${css({
    width: width ? `${round(width / EMU)}pt` : undefined,
    height: height ? `${round(height / EMU)}pt` : undefined,
    "max-width": "100%",
  })}>`;
}

// ------------------------------------------------------------------- rendering

type Context = {
  styles: StyleSheet;
  numbering: Numbering;
  media: Media;
  counters: Map<string, number>;
  fields: string[];
  seen: Set<string>;
};

/** Split text on placeholders, wrapping each one so it can be filled live. */
function renderText(text: string, context: Context): string {
  if (!text) return "";
  let output = "";
  let cursor = 0;

  for (const match of text.matchAll(PLACEHOLDER)) {
    const key = match[1];
    output += escapeHtml(text.slice(cursor, match.index));
    output += `<span class="docx-field" data-field="${escapeHtml(key)}">${BLANK}</span>`;
    cursor = match.index + match[0].length;
    if (!context.seen.has(key)) { context.seen.add(key); context.fields.push(key); }
  }

  return output + escapeHtml(text.slice(cursor));
}

function renderRun(run: XNode, context: Context, inherited: Formatting): string {
  const formatting = merge(inherited, readRunFormatting(child(run, "w:rPr")));
  let content = "";

  for (const item of run.children) {
    switch (item.tag) {
      case "w:t":
        content += renderText(item.text, context);
        break;
      case "w:tab":
        content += "\t";
        break;
      case "w:br":
      case "w:cr":
        content += "<br>";
        break;
      case "w:noBreakHyphen":
        content += "‑";
        break;
      case "w:drawing":
      case "w:pict":
      case "w:object":
        content += renderImage(item, context.media);
        break;
      default:
        break; // field codes, bookmarks, proofing marks — nothing to show
    }
  }

  if (!content) return "";

  const style = css({
    "font-weight": formatting.bold ? "700" : undefined,
    "font-style": formatting.italic ? "italic" : undefined,
    "text-decoration": [formatting.underline ? "underline" : "", formatting.strike ? "line-through" : ""]
      .filter(Boolean).join(" ") || undefined,
    "font-size": formatting.size ? `${round(formatting.size)}pt` : undefined,
    "font-family": formatting.family,
    color: formatting.colour,
    "text-transform": formatting.caps ? "uppercase" : undefined,
  });

  return style ? `<span${style}>${content}</span>` : content;
}

function listMarker(pPr: XNode | undefined, context: Context): string {
  const numPr = child(pPr, "w:numPr");
  const styleId = val(pPr, "w:pStyle");
  // Word's built-in list styles (List Number, List Bullet) keep the reference
  // on the style, so a paragraph using one carries no w:numPr of its own.
  const numId = val(numPr, "w:numId") ?? inherited(context.styles, styleId, "numId");
  if (!numId) return "";

  const level = num(val(numPr, "w:ilvl")) ?? inherited(context.styles, styleId, "level") ?? 0;
  const definition = context.numbering.get(numId)?.get(level);
  if (!definition) return "";

  const key = `${numId}:${level}`;
  const next = (context.counters.get(key) ?? definition.start - 1) + 1;
  context.counters.set(key, next);

  const marker = definition.text.replace(/%\d/g, () => formatNumber(next, definition.format));
  return marker ? `<span class="docx-marker">${escapeHtml(marker)}</span>` : "";
}

function renderParagraph(paragraph: XNode, context: Context): string {
  const pPr = child(paragraph, "w:pPr");
  const formatting = merge(
    context.styles.defaults,
    resolveStyle(context.styles, val(pPr, "w:pStyle")),
    readParagraphFormatting(pPr)
  );

  const marker = listMarker(pPr, context);
  let content = marker;

  for (const item of paragraph.children) {
    if (item.tag === "w:r") content += renderRun(item, context, formatting);
    // Tracked insertions still count as document text; deletions do not.
    else if (item.tag === "w:ins") {
      for (const run of children(item, "w:r")) content += renderRun(run, context, formatting);
    } else if (item.tag === "w:hyperlink") {
      for (const run of children(item, "w:r")) content += renderRun(run, context, formatting);
    }
  }

  const style = css({
    "text-align": formatting.align,
    "margin-left": formatting.indentLeft ? `${round(formatting.indentLeft / TWIP)}pt` : undefined,
    "margin-right": formatting.indentRight ? `${round(formatting.indentRight / TWIP)}pt` : undefined,
    "text-indent": formatting.firstLine ? `${round(formatting.firstLine / TWIP)}pt` : undefined,
    "margin-top": formatting.spaceBefore ? `${round(formatting.spaceBefore / TWIP)}pt` : undefined,
    "margin-bottom": formatting.spaceAfter !== undefined ? `${round(formatting.spaceAfter / TWIP)}pt` : undefined,
    "line-height": formatting.lineHeight,
    "font-size": formatting.size ? `${round(formatting.size)}pt` : undefined,
    "font-family": formatting.family,
    "font-weight": formatting.bold ? "700" : undefined,
  });

  // An empty paragraph is deliberate vertical space on a form, so keep it.
  return `<p${style}>${content || "<br>"}</p>`;
}

// ---------------------------------------------------------------------- tables

type Border = { size?: number; style?: string; colour?: string };

function readBorder(parent: XNode | undefined, side: string): Border | undefined {
  const element = child(parent, side);
  if (!element) return undefined;
  const style = element.attrs["w:val"];
  if (!style || style === "nil" || style === "none") return { style: "none" };
  return {
    size: num(element.attrs["w:sz"]),
    style: style === "double" ? "double" : style === "dashed" ? "dashed" : style === "dotted" ? "dotted" : "solid",
    colour: colour(element.attrs["w:color"]),
  };
}

function borderCss(border: Border | undefined): string | undefined {
  if (!border || border.style === "none") return undefined;
  const width = Math.max(0.5, (border.size ?? 4) / 8);
  return `${round(width)}pt ${border.style ?? "solid"} ${border.colour ?? "#111827"}`;
}

type Cell = { body: string; style: string; colspan: number; rowspan: number };

function renderTable(table: XNode, context: Context): string {
  const tblPr = child(table, "w:tblPr");
  const tableBorders = child(tblPr, "w:tblBorders")
    ?? inherited(context.styles, val(tblPr, "w:tblStyle"), "tableBorders");
  const grid = children(child(table, "w:tblGrid"), "w:gridCol")
    .map((column) => num(column.attrs["w:w"]) ?? 0);
  const totalWidth = grid.reduce((sum, width) => sum + width, 0);

  const rows = children(table, "w:tr");
  const cells: Cell[][] = rows.map(() => []);
  // The cell currently spanning down each grid column, so that a continued
  // vertical merge grows the rowspan of the cell that started it.
  const spanning = new Map<number, Cell>();

  rows.forEach((row, rowIndex) => {
    let columnIndex = 0;

    for (const source of children(row, "w:tc")) {
      const tcPr = child(source, "w:tcPr");
      const colspan = num(val(tcPr, "w:gridSpan")) ?? 1;
      const vMerge = child(tcPr, "w:vMerge");
      const continues = vMerge !== undefined && (vMerge.attrs["w:val"] ?? "continue") === "continue";

      if (continues) {
        const owner = spanning.get(columnIndex);
        if (owner) owner.rowspan += 1;
        columnIndex += colspan;
        continue;
      }

      const widthTwips = grid.slice(columnIndex, columnIndex + colspan).reduce((sum, w) => sum + w, 0);
      const cellBorders = child(tcPr, "w:tcBorders");
      const resolve = (side: string, edge: boolean, inside: string): Border | undefined =>
        readBorder(cellBorders, side)
        ?? readBorder(tableBorders, edge ? side : inside)
        ?? readBorder(tableBorders, side);

      const cell: Cell = {
        colspan,
        rowspan: 1,
        style: css({
          width: totalWidth && widthTwips ? `${round((widthTwips / totalWidth) * 100)}%` : undefined,
          "border-top": borderCss(resolve("w:top", rowIndex === 0, "w:insideH")),
          "border-bottom": borderCss(resolve("w:bottom", rowIndex === rows.length - 1, "w:insideH")),
          "border-left": borderCss(resolve("w:left", columnIndex === 0, "w:insideV")),
          "border-right": borderCss(resolve("w:right", columnIndex + colspan >= grid.length, "w:insideV")),
          "background-color": colour(child(tcPr, "w:shd")?.attrs["w:fill"]),
          "vertical-align": val(tcPr, "w:vAlign") === "center" ? "middle"
            : val(tcPr, "w:vAlign") === "bottom" ? "bottom" : "top",
          padding: "0 5.4pt",
        }),
        body: source.children
          .map((item) =>
            item.tag === "w:p" ? renderParagraph(item, context)
            : item.tag === "w:tbl" ? renderTable(item, context)
            : "")
          .join("") || "<p><br></p>",
      };

      cells[rowIndex].push(cell);
      if (vMerge) spanning.set(columnIndex, cell); else spanning.delete(columnIndex);
      columnIndex += colspan;
    }
  });

  const html = cells
    .map((row) => `<tr>${row
      .map((cell) =>
        `<td${cell.colspan > 1 ? ` colspan="${cell.colspan}"` : ""}`
        + `${cell.rowspan > 1 ? ` rowspan="${cell.rowspan}"` : ""}${cell.style}>${cell.body}</td>`)
      .join("")}</tr>`)
    .join("");


  const indent = num(child(tblPr, "w:tblInd")?.attrs["w:w"]);
  return `<table${css({
    "border-collapse": "collapse",
    width: "100%",
    "margin-left": indent ? `${round(indent / TWIP)}pt` : undefined,
    "table-layout": "fixed",
  })}>${html}</table>`;
}

// ------------------------------------------------------------------ entry point

function readPage(body: XNode | undefined): DocxPage {
  const sectPr = children(body, "w:sectPr").pop() ?? descendant(body, "w:sectPr");
  const size = child(sectPr, "w:pgSz");
  const margin = child(sectPr, "w:pgMar");
  const landscape = size?.attrs["w:orient"] === "landscape";

  const width = num(size?.attrs["w:w"]);
  const height = num(size?.attrs["w:h"]);

  const page: DocxPage = {
    width: width ? round(width / TWIP) : landscape ? A4.height : A4.width,
    height: height ? round(height / TWIP) : landscape ? A4.width : A4.height,
    marginTop: round((num(margin?.attrs["w:top"]) ?? A4.marginTop * TWIP) / TWIP),
    marginRight: round((num(margin?.attrs["w:right"]) ?? A4.marginRight * TWIP) / TWIP),
    marginBottom: round((num(margin?.attrs["w:bottom"]) ?? A4.marginBottom * TWIP) / TWIP),
    marginLeft: round((num(margin?.attrs["w:left"]) ?? A4.marginLeft * TWIP) / TWIP),
  };

  // Guard against nonsense values in hand-edited files.
  if (page.width < 100 || page.width > 3000) page.width = A4.width;
  if (page.height < 100 || page.height > 3000) page.height = A4.height;
  for (const side of ["marginTop", "marginRight", "marginBottom", "marginLeft"] as const) {
    if (page[side] < 0 || page[side] > page.width / 2) page[side] = 45;
  }
  return page;
}

function renderBlocks(container: XNode, context: Context): string {
  return container.children
    .map((item) =>
      item.tag === "w:p" ? renderParagraph(item, context)
      : item.tag === "w:tbl" ? renderTable(item, context)
      : item.tag === "w:sdt" ? renderBlocks(child(item, "w:sdtContent") ?? item, context)
      : "")
    .join("");
}

/** Read a .docx and produce print-shaped HTML plus its placeholder list. */
export async function renderDocxToHtml(buffer: Buffer): Promise<DocxRender> {
  const zip = await JSZip.loadAsync(buffer);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) throw new Error("This file is not a readable Word document.");

  const [documentXml, stylesXml, numberingXml] = await Promise.all([
    documentFile.async("string"),
    zip.file("word/styles.xml")?.async("string"),
    zip.file("word/numbering.xml")?.async("string"),
  ]);

  const context: Context = {
    styles: readStyles(stylesXml),
    numbering: readNumbering(numberingXml),
    media: await readMedia(zip, "word/_rels/document.xml.rels"),
    counters: new Map(),
    fields: [],
    seen: new Set(),
  };

  // Flatten first: Word splits a typed "{{name}}" across runs, so the
  // placeholder only exists as one string after the paragraph is collapsed.
  const root = parseXml(flattenPlaceholderParagraphs(documentXml));
  const body = child(child(root, "w:document"), "w:body");

  return {
    html: body ? renderBlocks(body, context) : "",
    page: readPage(body),
    fields: context.fields,
  };
}
