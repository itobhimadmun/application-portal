"use client";

import { useActionState, useRef } from "react";
import { uploadApplicationFile, type ActionState } from "@/lib/actions";
import { ACCEPT_ATTRIBUTE } from "@/lib/storage";
import type { Locale } from "@/lib/i18n";

export default function FileUploadForm({
  applicationId, locale, maxMb,
}: { applicationId: number; locale: Locale; maxMb: number }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(uploadApplicationFile, {});
  const formRef = useRef<HTMLFormElement>(null);
  const L = (ne: string, en: string) => (locale === "en" ? en : ne);

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await action(formData);
        formRef.current?.reset();
      }}
      className="space-y-3"
    >
      <input type="hidden" name="application_id" value={applicationId} />
      {state.error ? <p className="alert-danger" role="alert">{state.error}</p> : null}
      {state.ok ? <p className="alert-success" role="status">{state.message}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="gov-label" htmlFor="label_ne">{L("फाइलको नाम (नेपाली)", "File label (Nepali)")}</label>
          <input id="label_ne" name="label_ne" className="gov-input" placeholder={L("निवेदन फारम", "Application form")} />
        </div>
        <div>
          <label className="gov-label" htmlFor="label_en">{L("फाइलको नाम (अंग्रेजी)", "File label (English)")}</label>
          <input id="label_en" name="label_en" className="gov-input" placeholder="Application form" />
        </div>
      </div>

      <div>
        <label className="gov-label" htmlFor="file">{L("फाइल छान्नुहोस्", "Choose a file")}</label>
        <input
          id="file" name="file" type="file" required accept={ACCEPT_ATTRIBUTE}
          className="block w-full rounded-[6px] border border-line-200 bg-white px-3 py-2.5 text-[15px] file:mr-3 file:rounded file:border-0 file:bg-royal-50 file:px-3 file:py-1.5 file:text-royal-700"
        />
        <span className="gov-hint">
          PDF · Word (doc, docx, odt, rtf) · Excel (xls, xlsx, ods, csv) — {L("अधिकतम", "max")} {maxMb} MB
        </span>
      </div>

      <label className="flex items-center gap-2 text-[14px] text-ink-700">
        <input type="checkbox" name="is_editable" className="h-4 w-4" />
        {L("यो सम्पादनयोग्य फाइल हो", "This is an editable template")}
      </label>

      <button type="submit" disabled={pending} className="btn-primary btn-sm">
        {pending ? "…" : L("अपलोड गर्नुहोस्", "Upload")}
      </button>
    </form>
  );
}
