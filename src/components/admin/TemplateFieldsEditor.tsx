"use client";

import { useActionState, useState } from "react";
import { saveTemplateFields, type ActionState } from "@/lib/actions";
import type { TemplateField } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

/**
 * Where an administrator names the variables found inside an uploaded .docx.
 * The keys themselves come from the file ({{name}}, {{ward}} …) — this screen is
 * only about giving each one a label a citizen will understand.
 */
export default function TemplateFieldsEditor({
  fileId, applicationId, fileName, initial, locale,
}: {
  fileId: number;
  applicationId: number;
  fileName: string;
  initial: TemplateField[];
  locale: Locale;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveTemplateFields, {});
  const [fields, setFields] = useState<TemplateField[]>(initial);
  const L = (ne: string, en: string) => (locale === "en" ? en : ne);

  const update = (i: number, patch: Partial<TemplateField>) =>
    setFields((f) => f.map((row, j) => (j === i ? { ...row, ...patch } : row)));

  return (
    <form action={action} className="mt-4 rounded-[6px] border border-royal-200 bg-royal-50 p-4">
      <input type="hidden" name="file_id" value={fileId} />
      <input type="hidden" name="application_id" value={applicationId} />
      <input type="hidden" name="fields" value={JSON.stringify(fields)} />

      <p className="text-[15px] font-bold text-ink-900">
        {L("भर्न मिल्ने ठाउँहरू", "Fillable fields")} — <span className="font-normal">{fileName}</span>
      </p>
      <p className="mt-1 text-[13.5px] text-ink-700">
        {L(
          "यी नामहरू फाइलभित्रका {{ }} बाट आएका हुन्। नागरिकलाई देखिने लेबल यहाँ लेख्नुहोस्।",
          "These names come from the {{ }} placeholders inside the file. Give each one the label a citizen should see."
        )}
      </p>

      {state.error ? <p className="alert-danger mt-3" role="alert">{state.error}</p> : null}
      {state.ok ? <p className="alert-success mt-3" role="status">{state.message}</p> : null}

      {fields.length ? (
        <ol className="mt-3 space-y-2">
          {fields.map((field, i) => (
            <li
              key={field.key}
              className="grid gap-2 rounded-[6px] border border-line-200 bg-white p-3 sm:grid-cols-[150px_1fr_1fr_130px]"
            >
              <code className="self-center font-mono text-[13px] text-royal-700">
                {`{{${field.key}}}`}
              </code>
              <input
                className="gov-input"
                value={field.label_ne}
                placeholder={L("लेबल (नेपाली)", "Label (Nepali)")}
                onChange={(e) => update(i, { label_ne: e.target.value })}
              />
              <input
                className="gov-input"
                value={field.label_en}
                placeholder={L("लेबल (अंग्रेजी)", "Label (English)")}
                onChange={(e) => update(i, { label_en: e.target.value })}
              />
              <select
                className="gov-select"
                value={field.type}
                onChange={(e) => update(i, { type: e.target.value as TemplateField["type"] })}
              >
                <option value="text">{L("एकहरे", "Text")}</option>
                <option value="textarea">{L("अनुच्छेद", "Paragraph")}</option>
                <option value="number">{L("अंक", "Number")}</option>
                <option value="date">{L("मिति", "Date")}</option>
              </select>
            </li>
          ))}
        </ol>
      ) : (
        <p className="alert-warning mt-3">
          {L(
            "यो फाइलमा कुनै {{ }} भेटिएन। Word मा भर्नुपर्ने ठाउँमा {{name}} जस्तै लेखेर पुनः अपलोड गर्नुहोस्।",
            "No {{ }} placeholders were found in this file. Type them in Word where a value belongs — e.g. {{name}} — and upload it again."
          )}
        </p>
      )}

      {fields.length ? (
        <button type="submit" disabled={pending} className="btn-primary btn-sm mt-3">
          {pending ? "…" : L("लेबल सुरक्षित गर्नुहोस्", "Save labels")}
        </button>
      ) : null}
    </form>
  );
}
