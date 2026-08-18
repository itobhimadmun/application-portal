import Link from "next/link";
import { pick, translator, type Locale } from "@/lib/i18n";
import { toNepaliDigits } from "@/lib/translit";
import type { ApplicationSummary } from "@/lib/types";
import { IconChevron, IconDoc, IconBuilding, IconMap } from "./ui/Icons";

const KIND_LABEL: Record<string, string> = { pdf: "PDF", word: "Word", excel: "Excel", other: "File" };

export default function ServiceCard({
  app, locale,
}: { app: ApplicationSummary; locale: Locale }) {
  const t = translator(locale);
  const num = (n: number) => (locale === "ne" ? toNepaliDigits(n) : String(n));
  const wards = app.all_wards
    ? t("filter.allWards")
    : app.ward_numbers.map((w) => (locale === "ne" ? `वडा ${toNepaliDigits(w)}` : `Ward ${w}`)).join(", ");

  return (
    <article className="gov-card flex h-full flex-col p-4 transition-shadow hover:shadow-md sm:p-5">
      <div className="mb-2 flex flex-wrap items-center gap-1.5">
        {app.category_slug ? (
          <span className="badge-royal">{pick(locale, app.category_name_ne, app.category_name_en)}</span>
        ) : null}
        {app.is_sample ? <span className="badge-warning">{locale === "ne" ? "नमुना" : "Sample"}</span> : null}
        {app.status !== "published" ? (
          <span className="badge-neutral">{app.status === "draft" ? (locale === "ne" ? "मस्यौदा" : "Draft") : (locale === "ne" ? "संग्रहित" : "Archived")}</span>
        ) : null}
      </div>

      <h3 className="text-[17px] font-bold leading-snug text-ink-900">
        <Link href={`/services/${app.slug}`} className="hover:text-royal-600 hover:underline">
          {pick(locale, app.title_ne, app.title_en)}
        </Link>
      </h3>
      {locale === "ne" && app.title_en ? (
        <p className="mt-0.5 text-[13.5px] text-ink-500">{app.title_en}</p>
      ) : null}
      {locale === "en" && app.title_ne ? (
        <p className="mt-0.5 text-[13.5px] text-ink-500">{app.title_ne}</p>
      ) : null}

      {pick(locale, app.description_ne, app.description_en) ? (
        <p className="mt-2 line-clamp-2 text-[14.5px] text-ink-700">
          {pick(locale, app.description_ne, app.description_en)}
        </p>
      ) : null}

      <dl className="mt-3 space-y-1 text-[13.5px] text-ink-500">
        {app.section_slug ? (
          <div className="flex items-start gap-1.5">
            <IconBuilding className="mt-0.5 h-4 w-4 shrink-0" />
            <dd>{pick(locale, app.section_name_ne, app.section_name_en)}</dd>
          </div>
        ) : null}
        <div className="flex items-start gap-1.5">
          <IconMap className="mt-0.5 h-4 w-4 shrink-0" />
          <dd>{wards}</dd>
        </div>
      </dl>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-500">
        <span className="inline-flex items-center gap-1">
          <IconDoc className="h-4 w-4" /> {num(app.document_count)} {t("app.documentsCount")}
        </span>
        <span>· {num(app.step_count)} {t("app.stepsCount")}</span>
        {app.file_kinds.length ? (
          <span className="flex gap-1">
            {app.file_kinds.map((k) => (
              <span key={k} className="badge-neutral">{KIND_LABEL[k] ?? k}</span>
            ))}
          </span>
        ) : null}
        {app.online_form_enabled ? <span className="badge-success">{t("doc.fillOnline")}</span> : null}
      </div>

      <div className="mt-4 pt-1">
        <Link href={`/services/${app.slug}`} className="btn-secondary btn-sm w-full sm:w-auto">
          {t("app.viewDetails")} <IconChevron className="h-4 w-4" />
        </Link>
      </div>
    </article>
  );
}
