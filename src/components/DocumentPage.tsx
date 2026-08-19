import type { DocxPageBox } from "@/lib/types";

/**
 * The application, drawn at the size of the paper it will become.
 *
 * The HTML comes from the uploaded .docx and is generated entirely by the
 * portal — the renderer emits its own tags and escapes every piece of text
 * that came out of the file, so nothing arbitrary can reach the page.
 */
export default function DocumentPage({
  html, page, className = "", zoom = 1, id,
}: {
  html: string;
  page: DocxPageBox;
  className?: string;
  /** Screen-only scale; printing always uses the real size. */
  zoom?: number;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`docx-page ${className}`}
      style={{
        width: `${page.width}pt`,
        minHeight: `${page.height}pt`,
        paddingTop: `${page.marginTop}pt`,
        paddingRight: `${page.marginRight}pt`,
        paddingBottom: `${page.marginBottom}pt`,
        paddingLeft: `${page.marginLeft}pt`,
        ...(zoom === 1 ? {} : { zoom }),
      }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
