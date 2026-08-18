import { notFound } from "next/navigation";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import { getLocale, translator, pick } from "@/lib/i18n";
import { toNepaliDigits } from "@/lib/translit";
import { getApplicationBySlug } from "@/lib/queries";
import { site } from "@/lib/site";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

/** A deliberately plain, printer-friendly summary sheet. */
export default async function PrintPage({ params }: { params: Params }) {
  const locale = await getLocale();
  const t = translator(locale);
  const { slug } = await params;

  const app = await getApplicationBySlug(slug);
  if (!app) notFound();

  const wards = app.all_wards
    ? t("filter.allWards")
    : app.ward_numbers.map((w) => (locale === "ne" ? `वडा ${toNepaliDigits(w)}` : `Ward ${w}`)).join(", ");

  return (
    <div className="gov-container max-w-3xl py-6">
      <div className="no-print mb-5 flex flex-wrap gap-2">
        <PrintButton label={t("doc.print")} className="btn-primary" />
        <Link href={`/services/${app.slug}`} className="btn-outline">{t("app.viewDetails")}</Link>
      </div>

      <article className="print-sheet gov-card p-6">
        <header className="mb-5 border-b border-line-200 pb-4 text-center">
          <p className="text-[13px] text-ink-500">{t("gov.nepal")}</p>
          <p className="text-[18px] font-bold text-ink-900">
            {locale === "en" ? site.nameEn : site.nameNe}
          </p>
          <p className="text-[13px] text-ink-500">
            {locale === "en" ? site.addressEn : site.addressNe}
          </p>
        </header>

        <h1 className="text-[22px] font-bold text-ink-900">{pick(locale, app.title_ne, app.title_en)}</h1>
        <p className="text-[14px] text-ink-500">{locale === "ne" ? app.title_en : app.title_ne}</p>

        {pick(locale, app.description_ne, app.description_en) ? (
          <p className="mt-3 text-[15px]">{pick(locale, app.description_ne, app.description_en)}</p>
        ) : null}

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-2 border-y border-line-200 py-3 text-[14.5px]">
          <div>
            <dt className="text-ink-500">{t("app.section")}</dt>
            <dd className="font-semibold">{pick(locale, app.section_name_ne, app.section_name_en) || "—"}</dd>
          </div>
          <div>
            <dt className="text-ink-500">{t("app.appliesAt")}</dt>
            <dd className="font-semibold">{pick(locale, app.office_ne, app.office_en) || wards}</dd>
          </div>
          {pick(locale, app.fee_ne, app.fee_en) ? (
            <div>
              <dt className="text-ink-500">{t("app.fee")}</dt>
              <dd className="font-semibold">{pick(locale, app.fee_ne, app.fee_en)}</dd>
            </div>
          ) : null}
          {pick(locale, app.duration_ne, app.duration_en) ? (
            <div>
              <dt className="text-ink-500">{t("app.duration")}</dt>
              <dd className="font-semibold">{pick(locale, app.duration_ne, app.duration_en)}</dd>
            </div>
          ) : null}
        </dl>

        {app.requirements.length ? (
          <section className="mt-5">
            <h2 className="mb-2 text-[16px] font-bold">{t("app.documents")}</h2>
            <ol className="list-decimal space-y-1 pl-5 text-[15px]">
              {app.requirements.map((doc) => (
                <li key={doc.id}>
                  {pick(locale, doc.label_ne, doc.label_en)}
                  {!doc.is_required ? ` (${locale === "ne" ? "ऐच्छिक" : "optional"})` : ""}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        {app.steps.length ? (
          <section className="mt-5">
            <h2 className="mb-2 text-[16px] font-bold">{t("app.process")}</h2>
            <ol className="list-decimal space-y-1.5 pl-5 text-[15px]">
              {app.steps.map((step) => (
                <li key={step.id}>
                  <span className="font-semibold">{pick(locale, step.title_ne, step.title_en)}</span>
                  {pick(locale, step.description_ne, step.description_en)
                    ? ` — ${pick(locale, step.description_ne, step.description_en)}`
                    : ""}
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <footer className="mt-6 border-t border-line-200 pt-3 text-[12.5px] text-ink-500">
          {site.phone} · {site.email}
        </footer>
      </article>
    </div>
  );
}
