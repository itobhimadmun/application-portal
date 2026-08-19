import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Breadcrumb from "@/components/ui/Breadcrumb";
import DocumentActions from "@/components/DocumentActions";
import RequirementList from "@/components/RequirementList";
import ServiceCard from "@/components/ServiceCard";
import SetupNotice from "@/components/SetupNotice";
import StepTimeline from "@/components/StepTimeline";
import { getLocale, translator, pick } from "@/lib/i18n";
import { toNepaliDigits } from "@/lib/translit";
import { getApplicationBySlug, getRelatedApplications, registerView } from "@/lib/queries";
import { IconBuilding, IconCash, IconClock, IconMap, IconAlert } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const app = await getApplicationBySlug(slug);
    if (!app) return { title: "Not found" };
    return {
      title: app.title_ne,
      description: app.description_ne || app.description_en,
    };
  } catch {
    return {};
  }
}

export default async function ApplicationDetailPage({ params }: { params: Params }) {
  const locale = await getLocale();
  const t = translator(locale);
  const { slug } = await params;

  let app, related;
  try {
    app = await getApplicationBySlug(slug);
    if (!app) notFound();
    related = await getRelatedApplications(app);
    void registerView(app.id);
  } catch (error) {
    if (error && typeof error === "object" && "digest" in error) throw error;
    return <SetupNotice error={error instanceof Error ? error.message : undefined} />;
  }

  const wards = app.all_wards
    ? t("filter.allWards")
    : app.ward_numbers.map((w) => (locale === "ne" ? `वडा ${toNepaliDigits(w)}` : `Ward ${w}`)).join(", ");
  const office = pick(locale, app.office_ne, app.office_en);
  const firstPdf = app.files.find((f) => f.kind === "pdf");
  const hasTemplate = app.files.some((f) => f.is_template && (f.template_fields?.length ?? 0) > 0);

  return (
    <>
      <Breadcrumb
        items={[
          { href: "/", label: t("nav.home") },
          { href: "/services", label: t("nav.services") },
          ...(app.category_slug
            ? [{ href: `/services?category=${app.category_slug}`, label: pick(locale, app.category_name_ne, app.category_name_en) }]
            : []),
          { label: pick(locale, app.title_ne, app.title_en) },
        ]}
      />

      <div className="gov-container py-6 sm:py-8">
        <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
          {/* --------------------------------------------------- main column */}
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap gap-1.5">
              {app.category_slug ? (
                <span className="badge-royal">{pick(locale, app.category_name_ne, app.category_name_en)}</span>
              ) : null}
              {app.is_sample ? <span className="badge-warning">{locale === "ne" ? "नमुना सामग्री" : "Sample content"}</span> : null}
            </div>

            <h1 className="page-title">{pick(locale, app.title_ne, app.title_en)}</h1>
            <p className="mt-1 text-[15px] text-ink-500">
              {locale === "ne" ? app.title_en : app.title_ne}
            </p>
            {pick(locale, app.description_ne, app.description_en) ? (
              <p className="mt-3 text-[16px] text-ink-700">
                {pick(locale, app.description_ne, app.description_en)}
              </p>
            ) : null}

            {app.is_sample ? (
              <p className="alert-warning mt-4 flex items-start gap-2">
                <IconAlert className="mt-0.5 h-5 w-5 shrink-0" /> {t("app.sampleNotice")}
              </p>
            ) : null}

            {/* The forms are what people come here for, so they lead the page. */}
            <section id="forms" className="mt-6 scroll-mt-4 rounded-[6px] border-2 border-royal-200 bg-royal-50 p-4 sm:p-5">
              <h2 className="section-title mb-3">{t("app.forms")}</h2>
              <DocumentActions
                files={app.files}
                locale={locale}
                slug={app.slug}
                onlineForm={app.online_form_enabled || hasTemplate}
              />
            </section>

            {pick(locale, app.about_ne, app.about_en) ? (
              <section className="mt-8">
                <h2 className="section-title">{t("app.about")}</h2>
                <p className="mt-2 whitespace-pre-line text-[16px] text-ink-700">
                  {pick(locale, app.about_ne, app.about_en)}
                </p>
              </section>
            ) : null}

            {app.requirements.length ? (
              <section className="mt-8">
                <h2 className="section-title mb-3">{t("app.documents")}</h2>
                <RequirementList items={app.requirements} locale={locale} />
              </section>
            ) : null}

            {app.steps.length ? (
              <section className="mt-8">
                <h2 className="section-title mb-4">{t("app.process")}</h2>
                <StepTimeline steps={app.steps} locale={locale} />
              </section>
            ) : null}

            {firstPdf ? (
              <section className="no-print mt-8">
                <h2 className="section-title mb-3">{t("doc.preview")}</h2>
                <object
                  data={`/api/files/${firstPdf.id}`}
                  type="application/pdf"
                  className="h-[520px] w-full rounded-[6px] border border-line-200"
                  aria-label={t("doc.preview")}
                >
                  <p className="p-4 text-[15px]">
                    <a className="text-royal-600 underline" href={`/api/files/${firstPdf.id}?download=1`}>
                      {t("doc.downloadPdf")}
                    </a>
                  </p>
                </object>
              </section>
            ) : null}

            {related.length ? (
              <section className="mt-10">
                <h2 className="section-title mb-3">{t("app.related")}</h2>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {related.map((item) => (
                    <li key={item.id}><ServiceCard app={item} locale={locale} /></li>
                  ))}
                </ul>
              </section>
            ) : null}
          </div>

          {/* ------------------------------------------------------- sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-4 lg:self-start">
            <div className="gov-card p-4">
              <h2 className="mb-3 text-[16px] font-bold text-ink-900">{t("app.relatedOffice")}</h2>
              <dl className="space-y-3 text-[15px]">
                {app.section_slug ? (
                  <div className="flex items-start gap-2">
                    <IconBuilding className="mt-0.5 h-5 w-5 shrink-0 text-royal-600" />
                    <div>
                      <dt className="text-[13px] text-ink-500">{t("app.section")}</dt>
                      <dd className="font-medium text-ink-900">
                        <Link href={`/services?section=${app.section_slug}`} className="hover:underline">
                          {pick(locale, app.section_name_ne, app.section_name_en)}
                        </Link>
                      </dd>
                    </div>
                  </div>
                ) : null}
                <div className="flex items-start gap-2">
                  <IconMap className="mt-0.5 h-5 w-5 shrink-0 text-royal-600" />
                  <div>
                    <dt className="text-[13px] text-ink-500">{t("app.appliesAt")}</dt>
                    <dd className="font-medium text-ink-900">{office || wards}</dd>
                    {office && wards ? <dd className="text-[13.5px] text-ink-500">{wards}</dd> : null}
                  </div>
                </div>
                {pick(locale, app.fee_ne, app.fee_en) ? (
                  <div className="flex items-start gap-2">
                    <IconCash className="mt-0.5 h-5 w-5 shrink-0 text-royal-600" />
                    <div>
                      <dt className="text-[13px] text-ink-500">{t("app.fee")}</dt>
                      <dd className="font-medium text-ink-900">{pick(locale, app.fee_ne, app.fee_en)}</dd>
                    </div>
                  </div>
                ) : null}
                {pick(locale, app.duration_ne, app.duration_en) ? (
                  <div className="flex items-start gap-2">
                    <IconClock className="mt-0.5 h-5 w-5 shrink-0 text-royal-600" />
                    <div>
                      <dt className="text-[13px] text-ink-500">{t("app.duration")}</dt>
                      <dd className="font-medium text-ink-900">{pick(locale, app.duration_ne, app.duration_en)}</dd>
                    </div>
                  </div>
                ) : null}
              </dl>
            </div>

            <div className="gov-card p-4">
              <a href="#forms" className="btn-crimson w-full">{t("app.forms")}</a>
              <Link href={`/services/${app.slug}/print`} className="btn-outline mt-2 w-full">
                {t("doc.print")}
              </Link>
              <p className="mt-3 text-[13px] text-ink-500">
                {t("app.updatedOn")}: {new Date(app.updated_at).toLocaleDateString("en-GB")}
              </p>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
