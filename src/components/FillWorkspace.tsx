"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import DocumentViewport from "./DocumentViewport";
import { IconDownload, IconPrint, IconAlert } from "./ui/Icons";
import type { Locale } from "@/lib/i18n";
import type { DocxPageBox, TemplateField } from "@/lib/types";
import { blankRules } from "@/lib/docx-blank";

/**
 * Filling an application, side by side with the application itself.
 *
 * The right-hand panel is the real document, rendered from the municipality's
 * own .docx. Typing writes straight into the matching blanks, so there is
 * never a "preview" button to press and never a question about where an
 * answer will land on the printed page.
 *
 * Nothing is submitted: the Word download posts the values once and gets the
 * finished file straight back, and printing happens entirely in the browser.
 */

export default function FillWorkspace({
  fileId, fields, html, page, locale, title, fileName,
}: {
  fileId: number;
  fields: TemplateField[];
  html: string;
  page: DocxPageBox;
  locale: Locale;
  title: string;
  fileName: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pdfHint, setPdfHint] = useState(false);
  const paper = useRef<HTMLDivElement>(null);

  const L = useCallback(
    (ne: string, en: string) => (locale === "en" ? en : ne),
    [locale]
  );
  const labelOf = (field: TemplateField) =>
    (locale === "en" ? field.label_en || field.label_ne : field.label_ne || field.label_en)
    || field.key.replace(/[_.\-]+/g, " ");

  /**
   * Push the current answers into the rendered document. Writing to the DOM
   * directly keeps the document markup out of React's hands — it is generated
   * HTML, not a component tree, and re-rendering it on every keystroke would
   * be both slower and pointless.
   */
  // Ruled lines are sized by field type, so an untouched blank looks exactly as
  // it will on the printed sheet.
  const rules = useMemo(() => blankRules(fields), [fields]);

  useEffect(() => {
    const root = paper.current;
    if (!root) return;
    for (const node of root.querySelectorAll<HTMLElement>("[data-field]")) {
      const key = node.dataset.field ?? "";
      const value = values[key]?.trim() ?? "";
      node.textContent = value || rules[key] || "";
      node.dataset.filled = value ? "1" : "0";
    }
  }, [values, html, rules]);

  const filledCount = useMemo(
    () => fields.filter((field) => (values[field.key] ?? "").trim()).length,
    [fields, values]
  );

  function set(key: string, value: string) {
    setValues((previous) => ({ ...previous, [key]: value }));
  }

  /** Enter moves to the next field rather than doing nothing. */
  function onKeyDown(event: React.KeyboardEvent<HTMLElement>, index: number) {
    if (event.key !== "Enter" || event.shiftKey) return;
    const target = event.target as HTMLElement;
    if (target.tagName === "TEXTAREA") return;
    event.preventDefault();
    const next = fields[index + 1];
    if (next) document.getElementById(`field-${next.key}`)?.focus();
    else (document.getElementById("fill-print") as HTMLButtonElement | null)?.focus();
  }

  async function downloadWord() {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch(`/api/fill/${fileId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!response.ok) throw new Error(String(response.status));

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${fileName || "application"}.docx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(L(
        "फाइल बनाउन सकिएन। फेरि प्रयास गर्नुहोस्।",
        "The document could not be generated. Please try again."
      ));
    } finally {
      setBusy(false);
    }
  }

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      <button id="fill-print" type="button" className="btn-crimson" onClick={() => window.print()}>
        <IconPrint className="h-[18px] w-[18px]" /> {L("प्रिन्ट गर्नुहोस्", "Print")}
      </button>
      <button
        type="button"
        className="btn-secondary"
        onClick={() => { setPdfHint(true); setTimeout(() => window.print(), 60); }}
      >
        <IconDownload className="h-[18px] w-[18px]" /> {L("PDF डाउनलोड", "Download PDF")}
      </button>
      <button type="button" className="btn-outline" disabled={busy} onClick={downloadWord}>
        <IconDownload className="h-[18px] w-[18px]" />
        {busy ? L("तयार हुँदैछ…", "Preparing…") : L("Word डाउनलोड", "Download Word")}
      </button>
    </div>
  );

  return (
    <>
      {/* Print exactly what the right-hand panel shows, at the document's size. */}
      <style>{"@media print{@page{margin:0}}"}</style>

      <div className="grid gap-6 lg:grid-cols-[minmax(300px,380px)_1fr] lg:items-start">
        {/* ------------------------------------------------- input panel */}
        <div data-print-hide className="lg:sticky lg:top-4">
          <div className="gov-card p-5">
            <div className="mb-4 flex items-baseline justify-between gap-3">
              <h2 className="text-[17px] font-bold text-ink-900">
                {L("विवरण भर्नुहोस्", "Fill in the details")}
              </h2>
              <span className="text-[13px] text-ink-500">
                {filledCount}/{fields.length}
              </span>
            </div>

            {error ? (
              <p className="alert-danger mb-4 flex items-start gap-2" role="alert">
                <IconAlert className="mt-0.5 h-5 w-5 shrink-0" /> {error}
              </p>
            ) : null}

            <div className="space-y-3.5">
              {fields.map((field, index) => (
                <div key={field.key}>
                  <label className="gov-label" htmlFor={`field-${field.key}`}>
                    {labelOf(field)}
                  </label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={`field-${field.key}`}
                      className="gov-textarea"
                      rows={3}
                      value={values[field.key] ?? ""}
                      onChange={(event) => set(field.key, event.target.value)}
                    />
                  ) : (
                    <input
                      id={`field-${field.key}`}
                      type="text"
                      inputMode={field.type === "number" ? "numeric" : undefined}
                      placeholder={field.type === "date" ? L("२०८२/०५/०३", "e.g. 2082/05/03") : undefined}
                      autoComplete="off"
                      className="gov-input"
                      value={values[field.key] ?? ""}
                      onChange={(event) => set(field.key, event.target.value)}
                      onKeyDown={(event) => onKeyDown(event, index)}
                    />
                  )}
                </div>
              ))}
            </div>

            <div className="mt-5 border-t border-line-100 pt-4">{actions}</div>

            {pdfHint ? (
              <p className="alert-info mt-3 text-[14px]">
                {L(
                  "प्रिन्ट विन्डोमा गन्तव्य (Destination) मा “Save as PDF” रोज्नुहोस्।",
                  "In the print window, choose “Save as PDF” as the destination."
                )}
              </p>
            ) : null}

            <button
              type="button"
              className="mt-3 text-[14px] font-semibold text-royal-600 hover:underline"
              onClick={() => setValues({})}
            >
              {L("सबै खाली गर्नुहोस्", "Clear all")}
            </button>

            <p className="gov-hint mt-3">
              {L(
                "भरेको विवरण कहीँ पठाइँदैन र सुरक्षित पनि गरिँदैन।",
                "Nothing you type is sent anywhere or stored."
              )}
            </p>
          </div>
        </div>

        {/* ---------------------------------------------- live document */}
        <div className="min-w-0">
          <div data-print-hide className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[17px] font-bold text-ink-900">{title}</h2>
            <span className="text-[13px] text-ink-500">
              {L("तपाईंले टाइप गरेअनुसार तल देखिन्छ", "Updates as you type")}
            </span>
          </div>

          <DocumentViewport pageWidth={page.width} className="rounded-[6px] bg-line-100 p-3 sm:p-4">
            <div
              ref={paper}
              className="docx-page"
              style={{
                width: `${page.width}pt`,
                minHeight: `${page.height}pt`,
                paddingTop: `${page.marginTop}pt`,
                paddingRight: `${page.marginRight}pt`,
                paddingBottom: `${page.marginBottom}pt`,
                paddingLeft: `${page.marginLeft}pt`,
              }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          </DocumentViewport>

          <div data-print-hide className="mt-4">{actions}</div>
        </div>
      </div>
    </>
  );
}
