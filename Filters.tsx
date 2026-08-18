import Link from "next/link";
import { translator, pick, type Locale } from "@/lib/i18n";
import { toNepaliDigits } from "@/lib/translit";
import type { Category, Section, Ward } from "@/lib/types";

export default function Filters({
  locale, categories, sections, wards, current,
}: {
  locale: Locale;
  categories: Category[];
  sections: Section[];
  wards: Ward[];
  current: { q?: string; category?: string; section?: string; ward?: string; doc?: string };
}) {
  const t = translator(locale);
  const hasFilters = Boolean(current.category || current.section || current.ward || current.doc);

  const docTypes = [
    { value: "pdf", label: "PDF" },
    { value: "word", label: "Word" },
    { value: "excel", label: "Excel" },
    { value: "online", label: t("doc.fillOnline") },
    { value: "printable", label: locale === "ne" ? "प्रिन्ट गर्न मिल्ने" : "Printable" },
  ];

  const body = (
    <form method="get" action="/services" className="space-y-4">
      {current.q ? <input type="hidden" name="q" value={current.q} /> : null}

      <div>
        <label className="gov-label" htmlFor="f-category">{t("filter.category")}</label>
        <select id="f-category" name="category" defaultValue={current.category ?? ""} className="gov-select">
          <option value="">{t("filter.all")}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.slug}>{pick(locale, c.name_ne, c.name_en)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="gov-label" htmlFor="f-section">{t("filter.section")}</label>
        <select id="f-section" name="section" defaultValue={current.section ?? ""} className="gov-select">
          <option value="">{t("filter.all")}</option>
          {sections.map((s) => (
            <option key={s.id} value={s.slug}>{pick(locale, s.name_ne, s.name_en)}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="gov-label" htmlFor="f-ward">{t("filter.ward")}</label>
        <select id="f-ward" name="ward" defaultValue={current.ward ?? ""} className="gov-select">
          <option value="">{t("filter.allWards")}</option>
          {wards.map((w) => (
            <option key={w.id} value={w.number}>
              {locale === "ne" ? `वडा ${toNepaliDigits(w.number)}` : `Ward ${w.number}`}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="gov-label" htmlFor="f-doc">{t("filter.docType")}</label>
        <select id="f-doc" name="doc" defaultValue={current.doc ?? ""} className="gov-select">
          <option value="">{t("filter.all")}</option>
          {docTypes.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="submit" className="btn-primary btn-sm flex-1">{t("filter.apply")}</button>
        {hasFilters ? (
          <Link
            href={current.q ? `/services?q=${encodeURIComponent(current.q)}` : "/services"}
            className="btn-outline btn-sm"
          >
            {t("filter.clear")}
          </Link>
        ) : null}
      </div>
    </form>
  );

  return (
    <>
      {/* Mobile: collapsible */}
      <details className="gov-card p-4 lg:hidden">
        <summary className="cursor-pointer select-none text-[15px] font-semibold text-ink-900">
          {t("filter.showFilters")}
        </summary>
        <div className="mt-4">{body}</div>
      </details>

      {/* Desktop: always visible */}
      <div className="hidden lg:block">
        <div className="gov-card p-4">
          <h2 className="mb-3 text-[16px] font-bold text-ink-900">{t("filter.title")}</h2>
          {body}
        </div>
      </div>
    </>
  );
}
