import { readFileSync, writeFileSync } from "node:fs";
import { renderDocxToHtml } from "@/lib/docx-html";

const path = process.argv[2] ?? "/tmp/template.docx";
const result = await renderDocxToHtml(readFileSync(path));
console.log("fields:", result.fields);
console.log("page:", result.page);
console.log("html length:", result.html.length);

const page = result.page;
writeFileSync("/tmp/render.html", `<!doctype html><meta charset="utf-8">
<style>
 body{background:#e5e7eb;margin:0;padding:24px;font-family:'Noto Sans Devanagari',sans-serif}
 .page{background:#fff;width:${page.width}pt;min-height:${page.height}pt;margin:0 auto;
   padding:${page.marginTop}pt ${page.marginRight}pt ${page.marginBottom}pt ${page.marginLeft}pt;
   box-shadow:0 1px 6px rgba(0,0,0,.2);font-size:11pt;line-height:1.5}
 .page p{margin:0;white-space:pre-wrap;tab-size:8}
 .docx-field{background:#fef3c7;border-bottom:1px solid #b45309}
 .docx-marker{display:inline-block;min-width:18pt}
</style><div class="page">${result.html}</div>`);
console.log("wrote /tmp/render.html");
