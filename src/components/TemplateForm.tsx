"use client";

import { useState } from "react";
import { IconDownload, IconAlert } from "./ui/Icons";
import type { TemplateField } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

/**
 * Fills the municipality's own Word template. The citizen types into the
 * fields an administrator defined, and gets back the same document — same
 * letterhead, same wording — with the blanks completed.
 *
 * Nothing is submitted or stored: the values go up, the finished file comes
 * straight back down.
 */
export default function TemplateForm({
  fileId, fields, locale, fileLabel,
}: {
  fileId: number;
  fields: TemplateField[];
  locale: Locale;
  fileLabel: string;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const L = (ne: string, en: string) => (locale === "en" ? en : ne);
  const label = (f: TemplateField) =>
    (locale === "en" ? f.label_en || f.label_ne : f.label_ne || f.label_en) || f.key;

  async function download() {
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
      anchor.download = `${fileLabel || "application"}.docx`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError(L("फाइल बनाउन सकिएन। फेरि प्रयास गर्नुहोस्।", "The document could not be generated. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="gov-card space-y-4 p-5" onSubmit={(e) => { e.preventDefault(); download(); }}>
      <p className="text-[15px] text-ink-700">
        {L(
          "तलका विवरण भर्नुहोस्, त्यसपछि भरिएको निवेदन Word फाइलमा डाउनलोड हुनेछ।",
          "Fill in the details below and the completed application downloads as a Word file."
        )}
      </p>

      {error ? (
        <p className="alert-danger flex items-start gap-2" role="alert">
          <IconAlert className="mt-0.5 h-5 w-5 shrink-0" /> {error}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : ""}>
            <label className="gov-label" htmlFor={`tf-${field.key}`}>{label(field)}</label>
            {field.type === "textarea" ? (
              <textarea
                id={`tf-${field.key}`}
                className="gov-textarea"
                value={values[field.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              />
            ) : (
              <input
                id={`tf-${field.key}`}
                type={field.type === "date" ? "date" : "text"}
                inputMode={field.type === "number" ? "numeric" : undefined}
                className="gov-input"
                value={values[field.key] ?? ""}
                onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="submit" disabled={busy} className="btn-crimson">
          <IconDownload className="h-4 w-4" />
          {busy ? L("तयार हुँदैछ…", "Preparing…") : L("भरिएको निवेदन डाउनलोड", "Download completed application")}
        </button>
        <button type="button" className="btn-outline" onClick={() => setValues({})}>
          {L("खाली गर्नुहोस्", "Clear")}
        </button>
      </div>

      <p className="gov-hint">
        {L(
          "भरिएको विवरण कहीँ सुरक्षित गरिँदैन — फाइल बनाएर तुरुन्तै पठाइन्छ। खाली छाडिएका ठाउँमा डटेड लाइन आउँछ।",
          "Nothing you type is stored — the file is generated and sent straight back. Any field left blank becomes a dotted line."
        )}
      </p>
    </form>
  );
}
