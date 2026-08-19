"use client";

import { useActionState, useState } from "react";
import { saveApplication, type ActionState, type ApplicationPayload } from "@/lib/actions";
import type { Category, Section, Ward, ApplicationDetail } from "@/lib/types";
import type { Locale } from "@/lib/i18n";

/**
 * Everything about an application that is *not* the file itself.
 *
 * The portal shows the form and nothing else, so this is deliberately short:
 * what the form is called, where it belongs, and the words that will find it.
 * The file, its placeholders and their labels are managed separately, above.
 */

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
  });

  const [categoryId, setCategoryId] = useState<string>(
    application?.category_slug
      ? String(categories.find((c) => c.slug === application.category_slug)?.id ?? "")
      : ""
  );
  const [sectionId, setSectionId] = useState<string>(
    application?.section_slug
      ? String(sections.find((s) => s.slug === application.section_slug)?.id ?? "")
      : ""
  );
  const [allWards, setAllWards] = useState(application?.all_wards ?? true);
  const [wardIds, setWardIds] = useState<number[]>(
    wards.filter((w) => application?.ward_numbers?.includes(w.number)).map((w) => w.id)
  );

  const [keywordsNe, setKeywordsNe] = useState((application?.keywords_ne ?? []).join(", "));
  const [keywordsEn, setKeywordsEn] = useState((application?.keywords_en ?? []).join(", "));
  const [aliases, setAliases] = useState((application?.aliases ?? []).join(", "));

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
    });
  }

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

      {/* ------------------------------------------------------------- name */}
      <fieldset className="gov-card p-5">
        <legend className="px-1 text-[16px] font-bold text-ink-900">
          {L(locale, "निवेदनको नाम", "Application name")}
        </legend>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="gov-label" htmlFor="title_ne">
              {L(locale, "नाम (नेपाली)", "Name (Nepali)")} *
            </label>
            <input id="title_ne" required className="gov-input" {...input("title_ne")} />
          </div>
          <div>
            <label className="gov-label" htmlFor="title_en">
              {L(locale, "नाम (अंग्रेजी)", "Name (English)")}
            </label>
            <input id="title_en" className="gov-input" {...input("title_en")} />
          </div>
          <div className="sm:col-span-2">
            <label className="gov-label" htmlFor="slug">{L(locale, "ठेगाना (URL slug)", "URL slug")}</label>
            <input id="slug" className="gov-input" placeholder="auto" {...input("slug")} />
            <span className="gov-hint">
              {L(locale, "खाली छोडे नामबाट स्वतः बन्छ।", "Leave empty to generate it from the name.")}
            </span>
          </div>
        </div>
      </fieldset>

      {/* --------------------------------------------------- classification */}
      <fieldset className="gov-card p-5">
        <legend className="px-1 text-[16px] font-bold text-ink-900">
          {L(locale, "वर्गीकरण", "Classification")}
        </legend>
        <p className="mt-1 text-[13.5px] text-ink-500">
          {L(locale,
            "यसले नागरिकलाई फाराम छान्न मात्र मद्दत गर्छ — निवेदनको पानामा देखिँदैन।",
            "These only help people narrow the library down; they do not appear on the application page.")}
        </p>
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
                  <label
                    className={`cursor-pointer rounded-[6px] border px-3 py-1.5 text-[14px] ${
                      wardIds.includes(w.id) ? "border-royal-600 bg-royal-50 text-royal-700" : "border-line-200"
                    }`}
                  >
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

      {/* --------------------------------------------------------- findable */}
      <fieldset className="gov-card p-5">
        <legend className="px-1 text-[16px] font-bold text-ink-900">
          {L(locale, "खोजीका लागि", "Making it findable")}
        </legend>
        <p className="mt-1 text-[13.5px] text-ink-500">
          {L(locale,
            "यी कतै देखिँदैनन् — खोज्दा मात्र काम लाग्छन्। नागरिकले प्रयोग गर्ने साधारण शब्द राख्नुहोस्; रोमन अक्षर स्वतः मिलाइन्छ।",
            "None of this is displayed — it only feeds search. Use the everyday words citizens actually type; romanised spellings are matched automatically.")}
        </p>
        <div className="mt-3 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="gov-label" htmlFor="description_ne">
              {L(locale, "छोटो विवरण (नेपाली)", "Short description (Nepali)")}
            </label>
            <textarea id="description_ne" className="gov-textarea" {...input("description_ne")} />
          </div>
          <div>
            <label className="gov-label" htmlFor="description_en">
              {L(locale, "छोटो विवरण (अंग्रेजी)", "Short description (English)")}
            </label>
            <textarea id="description_en" className="gov-textarea" {...input("description_en")} />
          </div>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <div>
            <label className="gov-label" htmlFor="kw-ne">{L(locale, "नेपाली शब्द", "Nepali keywords")}</label>
            <textarea id="kw-ne" className="gov-textarea" value={keywordsNe} onChange={(e) => setKeywordsNe(e.target.value)} />
          </div>
          <div>
            <label className="gov-label" htmlFor="kw-en">{L(locale, "अंग्रेजी शब्द", "English keywords")}</label>
            <textarea id="kw-en" className="gov-textarea" value={keywordsEn} onChange={(e) => setKeywordsEn(e.target.value)} />
          </div>
          <div>
            <label className="gov-label" htmlFor="kw-alias">{L(locale, "प्रचलित नाम", "Alternative names")}</label>
            <textarea id="kw-alias" className="gov-textarea" value={aliases} onChange={(e) => setAliases(e.target.value)} />
          </div>
        </div>
      </fieldset>

      {/* ---------------------------------------------------------- publish */}
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
