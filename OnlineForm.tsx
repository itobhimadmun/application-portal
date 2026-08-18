"use client";

import { useState } from "react";
import { IconPrint } from "./ui/Icons";
import type { FormField } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

export default function OnlineForm({
  fields, locale, title, subtitle, header, footer, labels,
}: {
  fields: FormField[];
  locale: Locale;
  title: string;
  subtitle: string;
  header: { line1: string; line2: string; line3: string };
  footer: string;
  labels: { print: string; clear: string; preview: string; fill: string; date: string; signature: string };
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const label = (f: FormField) => (locale === "en" ? f.label_en || f.label_ne : f.label_ne || f.label_en);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* ---------------------------------------------------------- editor */}
      <section className="no-print">
        <h2 className="section-title mb-3">{labels.fill}</h2>
        <form className="gov-card space-y-4 p-5" onSubmit={(e) => e.preventDefault()}>
          {fields.map((field) => (
            <div key={field.key}>
              <label className="gov-label" htmlFor={`f-${field.key}`}>
                {label(field)}
                {field.required ? <span className="text-crimson-600"> *</span> : null}
              </label>
              {field.type === "textarea" ? (
                <textarea
                  id={`f-${field.key}`}
                  className="gov-textarea"
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                />
              ) : (
                <input
                  id={`f-${field.key}`}
                  type={field.type === "number" ? "text" : field.type}
                  inputMode={field.type === "number" ? "numeric" : undefined}
                  className="gov-input"
                  value={values[field.key] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
                />
              )}
            </div>
          ))}

          <div className="flex flex-wrap gap-2 pt-1">
            <button type="button" onClick={() => window.print()} className="btn-primary">
              <IconPrint className="h-4 w-4" /> {labels.print}
            </button>
            <button type="button" onClick={() => setValues({})} className="btn-outline">
              {labels.clear}
            </button>
          </div>
          <p className="gov-hint">
            {locale === "ne"
              ? "प्रिन्ट संवादबाट “Save as PDF” छानेर PDF बनाउन सकिन्छ। भरिएको विवरण यही ब्राउजरमा मात्र रहन्छ, कतै पठाइँदैन।"
              : "Choose “Save as PDF” in the print dialog to get a PDF. What you type stays in your browser and is never uploaded."}
          </p>
        </form>
      </section>

      {/* --------------------------------------------------------- preview */}
      <section>
        <h2 className="section-title mb-3 no-print">{labels.preview}</h2>
        <article className="print-sheet gov-card p-6 leading-8">
          <header className="mb-5 text-center">
            <p className="text-[13px] text-ink-500">{header.line1}</p>
            <p className="text-[17px] font-bold text-ink-900">{header.line2}</p>
            <p className="text-[13px] text-ink-500">{header.line3}</p>
          </header>

          <h3 className="mb-1 text-center text-[18px] font-bold underline underline-offset-4">{title}</h3>
          {subtitle ? <p className="mb-4 text-center text-[14px] text-ink-500">{subtitle}</p> : null}

          <dl className="mt-4 space-y-2 text-[15px]">
            {fields.map((field) => (
              <div key={field.key} className="flex gap-2 border-b border-dotted border-line-200 pb-1">
                <dt className="w-2/5 shrink-0 text-ink-700">{label(field)}</dt>
                <dd className="flex-1 font-medium text-ink-900">{values[field.key] || " "}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex items-end justify-between text-[14px]">
            <div>
              <p className="text-ink-500">{labels.date}</p>
              <p className="mt-6 w-40 border-t border-ink-400" />
            </div>
            <div className="text-right">
              <p className="text-ink-500">{labels.signature}</p>
              <p className="mt-6 w-40 border-t border-ink-400" />
            </div>
          </div>

          <footer className="mt-6 border-t border-line-200 pt-3 text-[12px] text-ink-500">{footer}</footer>
        </article>
      </section>
    </div>
  );
}
