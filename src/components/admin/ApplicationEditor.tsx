"use client";

import { useActionState, useState } from "react";
import { saveApplication, type ActionState, type ApplicationPayload } from "@/lib/actions";
import type { Category, Section, Ward, ApplicationDetail, FormField } from "@/lib/types";
import type { Locale } from "@/lib/i18n";
import { IconPlus, IconTrash } from "@/components/ui/Icons";

type StepRow = { title_ne: string; title_en: string; description_ne: string; description_en: string };
type DocRow = { label_ne: string; label_en: string; note_ne: string; note_en: string; is_required: boolean };

const emptyStep: StepRow = { title_ne: "", title_en: "", description_ne: "", description_en: "" };
const emptyDoc: DocRow = { label_ne: "", label_en: "", note_ne: "", note_en: "", is_required: true };

function L(locale: Locale, ne: string, en: string) {
  return locale === "en" ? en : ne;
}

export default function ApplicationEditor({
  locale, categories, sections, wards, application,
}: {
  locale: Locale;
  categories: Category[];
  sections: Section[];
  wards: Ward[];
  application: ApplicationDetail | null;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveApplication, {});

  const [form, setForm] = useState({
    slug: application?.slug ?? "",
    title_ne: application?.title_ne ?? "",
    title_en: application?.title_en ?? "",
    description_ne: application?.description_ne ?? "",
    description_en: application?.description_en ?? "",
    about_ne: application?.about_ne ?? "",
    about_en: application?.about_en ?? "",
    office_ne: application?.office_ne ?? "",
    office_en: application?.office_en ?? "",
    fee_ne: application?.fee_ne ?? "",
    fee_en: application?.fee_en ?? "",
    duration_ne: application?.duration_ne ?? "",
    duration_en: application?.duration_en ?? "",
  });

  const [categoryId, setCategoryId] = useState<string>(
    application?.category_slug ? String(categories.find((c) => c.slug === application.category_slug)?.id ?? "") : ""
  );
  const [sectionId, setSectionId] = useState<string>(
    application?.section_slug ? String(sections.find((s) => s.slug === application.section_slug)?.id ?? "") : ""
  );
  const [allWards, setAllWards] = useState(application?.all_wards ?? true);
  const [wardIds, setWardIds] = useState<number[]>(
    wards.filter((w) => application?.ward_numbers?.includes(w.number)).map((w) => w.id)
  );

  const [keywordsNe, setKeywordsNe] = useState((application?.keywords_ne ?? []).join(", "));
  const [keywordsEn, setKeywordsEn] = useState((application?.keywords_en ?? []).join(", "));
  const [aliases, setAliases] = useState((application?.aliases ?? []).join(", "));

  const [steps, setSteps] = useState<StepRow[]>(
    application?.steps.length
      ? application.steps.map((s) => ({
          title_ne: s.title_ne, title_en: s.title_en,
          description_ne: s.description_ne, description_en: s.description_en,
        }))
      : [{ ...emptyStep }]
  );
  const [docs, setDocs] = useState<DocRow[]>(
    application?.requirements.length
      ? application.requirements.map((d) => ({
          label_ne: d.label_ne, label_en: d.label_en,
          note_ne: d.note_ne, note_en: d.note_en, is_required: d.is_required,
        }))
      : [{ ...emptyDoc }]
  );

  const [onlineEnabled, setOnlineEnabled] = useState(application?.online_form_enabled ?? false);
  const [fields, setFields] = useState<FormField[]>(
    Array.isArray(application?.online_form_schema) ? (application?.online_form_schema as FormField[]) : []
  );

  const [status] = useState<ApplicationPayload["status"]>(application?.status ?? "draft");
  const [isSample, setIsSample] = useState(application?.is_sample ?? false);

  function payload() {
    const list = (value: string) => value.split(",").map((s) => s.trim()).filter(Boolean);
    return JSON.stringify({
      id: application?.id ?? null,
      ...form,
      category_id: categoryId ? Number(categoryId) : null,
      section_id: sectionId ? Number(sectionId) : null,
      all_wards: allWards,
      ward_ids: allWards ? [] : wardIds,
      keywords_ne: list(keywordsNe),
      keywords_en: list(keywordsEn),
      aliases: list(aliases),
      status,
      is_sample: isSample,
      online_form_enabled: onlineEnabled,
      online_form_schema: fields,
      steps,
      requirements: docs,
    });
  }

  const move = <T,>(arr: T[], from: number, to: number): T[] => {
    if (to < 0 || to >= arr.length) return arr;
    const copy = [...arr];
    const [item] = copy.splice(from, 1);
    copy.splice(to, 0, item);
    return copy;
  };

  const input = (key: keyof typeof form) => ({
    value: form[key],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value })),
  });

  return (
    <form action={action} className="space-y-6">
      <input type="hidden" name="payload" value={payload()} />

      {state.error ? <p className="alert-danger" role="alert">{state.error}</p> : null}
      {state.ok ? <p className="alert-success" role="status">{state.message}</p> : null}

      {/* ------------------------------------------------ basic information */}
      <fieldset className="gov-card p-5">
        <legend className="px-1 text-[16px] font-bold text-ink-900">
          {L(locale, "आधारभूत विवरण", "Basic information")}
        </legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="gov-label" htmlFor="title_ne">{L(locale, "निवेदनको नाम (नेपाली)", "Title (Nepali)")} *</label>
            <input id="title_ne" required className="gov-input" {...input("title_ne")} />
          </div>
          <div>
            <label className="gov-label" htmlFor="title_en">{L(locale, "निवेदनको नाम (अंग्रेजी)", "Title (English)")}</label>
            <input id="title_en" className="gov-input" {...input("title_en")} />
          </div>
          <div>
            <label className="gov-label" htmlFor="description_ne">{L(locale, "छोटो विवरण (नेपाली)", "Short description (Nepali)")}</label>
            <textarea id="description_ne" className="gov-textarea" {...input("description_ne")} />
          </div>
          <div>
            <label className="gov-label" htmlFor="description_en">{L(locale, "छोटो विवरण (अंग्रेजी)", "Short description (English)")}</label>
            <textarea id="description_en" className="gov-textarea" {...input("description_en")} />
          </div>
          <div>
            <label className="gov-label" htmlFor="about_ne">{L(locale, "यो सेवा केका लागि हो? (नेपाली)", "What is it for? (Nepali)")}</label>
            <textarea id="about_ne" className="gov-textarea" {...input("about_ne")} />
          </div>
          <div>
            <label className="gov-label" htmlFor="about_en">{L(locale, "यो सेवा केका लागि हो? (अंग्रेजी)", "What is it for? (English)")}</label>
            <textarea id="about_en" className="gov-textarea" {...input("about_en")} />
          </div>
          <div className="sm:col-span-2">
            <label className="gov-label" htmlFor="slug">{L(locale, "ठेगाना (URL slug)", "URL slug")}</label>
            <input id="slug" className="gov-input" placeholder="auto" {...input("slug")} />
            <span className="gov-hint">
              {L(locale, "खाली छोडे नामबाट स्वतः बन्छ।", "Leave empty to generate it from the title.")}
            </span>
          </div>
        </div>
      </fieldset>

      {/* ---------------------------------------------------- classification */}
      <fieldset className="gov-card p-5">
        <legend className="px-1 text-[16px] font-bold text-ink-900">
          {L(locale, "वर्गीकरण", "Classification")}
        </legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="gov-label" htmlFor="category">{L(locale, "वर्ग", "Category")}</label>
            <select id="category" className="gov-select" value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
              <option value="">—</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{locale === "en" ? c.name_en : c.name_ne}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="gov-label" htmlFor="section">{L(locale, "शाखा", "Section")}</label>
            <select id="section" className="gov-select" value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
              <option value="">—</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>{locale === "en" ? s.name_en : s.name_ne}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="gov-label" htmlFor="office_ne">{L(locale, "आवेदन दिने कार्यालय (नेपाली)", "Office (Nepali)")}</label>
            <input id="office_ne" className="gov-input" {...input("office_ne")} />
          </div>
          <div>
            <label className="gov-label" htmlFor="office_en">{L(locale, "आवेदन दिने कार्यालय (अंग्रेजी)", "Office (English)")}</label>
            <input id="office_en" className="gov-input" {...input("office_en")} />
          </div>
          <div>
            <label className="gov-label" htmlFor="fee_ne">{L(locale, "दस्तुर (नेपाली)", "Fee (Nepali)")}</label>
            <input id="fee_ne" className="gov-input" {...input("fee_ne")} />
          </div>
          <div>
            <label className="gov-label" htmlFor="duration_ne">{L(locale, "लाग्ने समय (नेपाली)", "Processing time (Nepali)")}</label>
            <input id="duration_ne" className="gov-input" {...input("duration_ne")} />
          </div>
          <div>
            <label className="gov-label" htmlFor="fee_en">{L(locale, "दस्तुर (अंग्रेजी)", "Fee (English)")}</label>
            <input id="fee_en" className="gov-input" {...input("fee_en")} />
          </div>
          <div>
            <label className="gov-label" htmlFor="duration_en">{L(locale, "लाग्ने समय (अंग्रेजी)", "Processing time (English)")}</label>
            <input id="duration_en" className="gov-input" {...input("duration_en")} />
          </div>
        </div>

        <div className="mt-4">
          <label className="flex items-center gap-2 text-[15px] font-semibold text-ink-700">
            <input type="checkbox" checked={allWards} onChange={(e) => setAllWards(e.target.checked)} className="h-4 w-4" />
            {L(locale, "सबै वडामा लागू हुन्छ", "Applies to all wards")}
          </label>
          {!allWards ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {wards.map((w) => (
                <li key={w.id}>
                  <label className={`cursor-pointer rounded-[6px] border px-3 py-1.5 text-[14px] ${wardIds.includes(w.id) ? "border-royal-600 bg-royal-50 text-royal-700" : "border-line-200"}`}>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={wardIds.includes(w.id)}
                      onChange={(e) =>
                        setWardIds((ids) => (e.target.checked ? [...ids, w.id] : ids.filter((i) => i !== w.id)))
                      }
                    />
                    {locale === "en" ? `Ward ${w.number}` : `वडा ${w.number}`}
                  </label>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </fieldset>

      {/* ----------------------------------------------------------- search */}
      <fieldset className="gov-card p-5">
        <legend className="px-1 text-[16px] font-bold text-ink-900">
          {L(locale, "खोजी शब्दहरू", "Search keywords")}
        </legend>
        <p className="mt-1 text-[13.5px] text-ink-500">
          {L(locale,
            "कमाले छुट्याएर लेख्नुहोस्। नागरिकले प्रयोग गर्ने साधारण शब्द पनि राख्नुहोस् — रोमन अक्षर स्वतः मिलाइन्छ।",
            "Separate with commas. Add the everyday words citizens actually use — romanised spellings are matched automatically.")}
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="gov-label" htmlFor="kw-ne">{L(locale, "नेपाली शब्द", "Nepali keywords")}</label>
            <textarea id="kw-ne" className="gov-textarea" value={keywordsNe} onChange={(e) => setKeywordsNe(e.target.value)} />
          </div>
          <div>
            <label className="gov-label" htmlFor="kw-en">{L(locale, "अंग्रेजी शब्द", "English keywords")}</label>
            <textarea id="kw-en" className="gov-textarea" value={keywordsEn} onChange={(e) => setKeywordsEn(e.target.value)} />
          </div>
          <div>
            <label className="gov-label" htmlFor="kw-alias">{L(locale, "प्रचलित/वैकल्पिक नाम", "Alternative names")}</label>
            <textarea id="kw-alias" className="gov-textarea" value={aliases} onChange={(e) => setAliases(e.target.value)} />
          </div>
        </div>
      </fieldset>

      {/* -------------------------------------------------------- procedure */}
      <fieldset className="gov-card p-5">
        <legend className="px-1 text-[16px] font-bold text-ink-900">{L(locale, "प्रक्रिया", "Procedure")}</legend>
        <ol className="mt-3 space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="rounded-[6px] border border-line-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[14px] font-bold text-ink-700">{L(locale, "चरण", "Step")} {i + 1}</span>
                <span className="flex gap-1">
                  <button type="button" className="btn-outline btn-sm" onClick={() => setSteps((s) => move(s, i, i - 1))} aria-label="Move up">↑</button>
                  <button type="button" className="btn-outline btn-sm" onClick={() => setSteps((s) => move(s, i, i + 1))} aria-label="Move down">↓</button>
                  <button type="button" className="btn-danger btn-sm" onClick={() => setSteps((s) => s.filter((_, j) => j !== i))} aria-label="Remove">
                    <IconTrash className="h-4 w-4" />
                  </button>
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="gov-input" placeholder={L(locale, "शीर्षक (नेपाली)", "Title (Nepali)")}
                  value={step.title_ne}
                  onChange={(e) => setSteps((s) => s.map((row, j) => (j === i ? { ...row, title_ne: e.target.value } : row)))} />
                <input className="gov-input" placeholder={L(locale, "शीर्षक (अंग्रेजी)", "Title (English)")}
                  value={step.title_en}
                  onChange={(e) => setSteps((s) => s.map((row, j) => (j === i ? { ...row, title_en: e.target.value } : row)))} />
                <textarea className="gov-textarea" placeholder={L(locale, "विवरण (नेपाली)", "Description (Nepali)")}
                  value={step.description_ne}
                  onChange={(e) => setSteps((s) => s.map((row, j) => (j === i ? { ...row, description_ne: e.target.value } : row)))} />
                <textarea className="gov-textarea" placeholder={L(locale, "विवरण (अंग्रेजी)", "Description (English)")}
                  value={step.description_en}
                  onChange={(e) => setSteps((s) => s.map((row, j) => (j === i ? { ...row, description_en: e.target.value } : row)))} />
              </div>
            </li>
          ))}
        </ol>
        <button type="button" className="btn-outline btn-sm mt-3" onClick={() => setSteps((s) => [...s, { ...emptyStep }])}>
          <IconPlus className="h-4 w-4" /> {L(locale, "चरण थप्नुहोस्", "Add step")}
        </button>
      </fieldset>

      {/* ----------------------------------------------- required documents */}
      <fieldset className="gov-card p-5">
        <legend className="px-1 text-[16px] font-bold text-ink-900">
          {L(locale, "आवश्यक कागजात", "Required documents")}
        </legend>
        <ol className="mt-3 space-y-3">
          {docs.map((doc, i) => (
            <li key={i} className="rounded-[6px] border border-line-200 p-3">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[14px] font-bold text-ink-700">{i + 1}</span>
                <span className="flex gap-1">
                  <button type="button" className="btn-outline btn-sm" onClick={() => setDocs((d) => move(d, i, i - 1))} aria-label="Move up">↑</button>
                  <button type="button" className="btn-outline btn-sm" onClick={() => setDocs((d) => move(d, i, i + 1))} aria-label="Move down">↓</button>
                  <button type="button" className="btn-danger btn-sm" onClick={() => setDocs((d) => d.filter((_, j) => j !== i))} aria-label="Remove">
                    <IconTrash className="h-4 w-4" />
                  </button>
                </span>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="gov-input" placeholder={L(locale, "कागजात (नेपाली)", "Document (Nepali)")}
                  value={doc.label_ne}
                  onChange={(e) => setDocs((d) => d.map((row, j) => (j === i ? { ...row, label_ne: e.target.value } : row)))} />
                <input className="gov-input" placeholder={L(locale, "कागजात (अंग्रेजी)", "Document (English)")}
                  value={doc.label_en}
                  onChange={(e) => setDocs((d) => d.map((row, j) => (j === i ? { ...row, label_en: e.target.value } : row)))} />
                <input className="gov-input" placeholder={L(locale, "टिप्पणी (नेपाली)", "Note (Nepali)")}
                  value={doc.note_ne}
                  onChange={(e) => setDocs((d) => d.map((row, j) => (j === i ? { ...row, note_ne: e.target.value } : row)))} />
                <input className="gov-input" placeholder={L(locale, "टिप्पणी (अंग्रेजी)", "Note (English)")}
                  value={doc.note_en}
                  onChange={(e) => setDocs((d) => d.map((row, j) => (j === i ? { ...row, note_en: e.target.value } : row)))} />
              </div>
              <label className="mt-2 flex items-center gap-2 text-[14px] text-ink-700">
                <input type="checkbox" className="h-4 w-4" checked={doc.is_required}
                  onChange={(e) => setDocs((d) => d.map((row, j) => (j === i ? { ...row, is_required: e.target.checked } : row)))} />
                {L(locale, "अनिवार्य", "Required")}
              </label>
            </li>
          ))}
        </ol>
        <button type="button" className="btn-outline btn-sm mt-3" onClick={() => setDocs((d) => [...d, { ...emptyDoc }])}>
          <IconPlus className="h-4 w-4" /> {L(locale, "कागजात थप्नुहोस्", "Add document")}
        </button>
      </fieldset>

      {/* ------------------------------------------------------ online form */}
      <fieldset className="gov-card p-5">
        <legend className="px-1 text-[16px] font-bold text-ink-900">{L(locale, "अनलाइन फारम", "Online form")}</legend>
        <label className="mt-2 flex items-center gap-2 text-[15px] font-semibold text-ink-700">
          <input type="checkbox" className="h-4 w-4" checked={onlineEnabled} onChange={(e) => setOnlineEnabled(e.target.checked)} />
          {L(locale, "अनलाइन भर्न मिल्ने बनाउने", "Allow citizens to fill this form online")}
        </label>
        {onlineEnabled ? (
          <>
            <p className="mt-2 text-[13.5px] text-ink-500">
              {L(locale, "कुनै फिल्ड नथपे मानक निवेदन ढाँचा प्रयोग हुन्छ।",
                "If you add no fields, a standard application layout is used.")}
            </p>
            <ol className="mt-3 space-y-2">
              {fields.map((field, i) => (
                <li key={i} className="grid gap-2 rounded-[6px] border border-line-200 p-3 sm:grid-cols-[1fr_1fr_140px_auto]">
                  <input className="gov-input" placeholder={L(locale, "लेबल (नेपाली)", "Label (Nepali)")}
                    value={field.label_ne}
                    onChange={(e) => setFields((f) => f.map((row, j) => (j === i ? { ...row, label_ne: e.target.value } : row)))} />
                  <input className="gov-input" placeholder={L(locale, "लेबल (अंग्रेजी)", "Label (English)")}
                    value={field.label_en}
                    onChange={(e) => setFields((f) => f.map((row, j) => (j === i ? { ...row, label_en: e.target.value } : row)))} />
                  <select className="gov-select" value={field.type}
                    onChange={(e) => setFields((f) => f.map((row, j) => (j === i ? { ...row, type: e.target.value as FormField["type"] } : row)))}>
                    <option value="text">Text</option>
                    <option value="textarea">Paragraph</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                  </select>
                  <button type="button" className="btn-danger btn-sm" onClick={() => setFields((f) => f.filter((_, j) => j !== i))} aria-label="Remove">
                    <IconTrash className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ol>
            <button
              type="button"
              className="btn-outline btn-sm mt-3"
              onClick={() =>
                setFields((f) => [...f, { key: `field_${f.length + 1}_${Date.now().toString(36)}`, label_ne: "", label_en: "", type: "text" }])
              }
            >
              <IconPlus className="h-4 w-4" /> {L(locale, "फिल्ड थप्नुहोस्", "Add field")}
            </button>
          </>
        ) : null}
      </fieldset>

      {/* --------------------------------------------------------- publish */}
      <div className="gov-card sticky bottom-0 z-10 flex flex-wrap items-center gap-3 border-t-2 border-royal-600 p-4">
        <label className="flex items-center gap-2 text-[14px] text-ink-700">
          <input type="checkbox" className="h-4 w-4" checked={isSample} onChange={(e) => setIsSample(e.target.checked)} />
          {L(locale, "नमुना सामग्री", "Sample content")}
        </label>
        <span className="flex-1" />
        <button type="submit" name="status_override" value="draft" disabled={pending} className="btn-outline">
          {L(locale, "मस्यौदा सुरक्षित", "Save draft")}
        </button>
        <button type="submit" name="status_override" value="published" disabled={pending} className="btn-primary">
          {pending ? "…" : L(locale, "प्रकाशित गर्नुहोस्", "Publish")}
        </button>
      </div>
    </form>
  );
}
