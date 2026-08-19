import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ApplicationActions, { actionsOfFiles } from "@/components/ApplicationActions";
import ApplicationCard from "@/components/ApplicationCard";
import Breadcrumb from "@/components/ui/Breadcrumb";
import DocumentPage from "@/components/DocumentPage";
import DocumentViewport from "@/components/DocumentViewport";
import SetupNotice from "@/components/SetupNotice";
import { getLocale, translator, pick } from "@/lib/i18n";
import { getPreview, primaryFile } from "@/lib/preview";
import { getApplicationBySlug, getRelatedApplications, registerView } from "@/lib/queries";
import { humanSize } from "@/lib/storage";
import { IconAlert, IconPrint } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  try {
    const { slug } = await params;
    const app = await getApplicationBySlug(slug);
    if (!app) return { title: "Not found" };
    return { title: app.title_ne };
  } catch {
    return {};
  }
}

/**
 * One application. The form is the page: its name, the four actions, and then
 * the document itself. There is no service write-up to scroll past — anyone
 * who has arrived here already knows what they came for.
 */
export default async function ApplicationPage({ params }: { params: Params }) {
  const locale = await getLocale();
  const t = translator(locale);
  const { slug } = await params;
  const L = (ne: string, en: string) => (locale === "en" ? en : ne);

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

  const title = pick(locale, app.title_ne, app.title_en);
  const alternate = locale === "ne" ? app.title_en : app.title_ne;
  const actions = actionsOfFiles(app.slug, app.files);

  const lead = primaryFile(app.files);
  const preview = lead ? await getPreview(lead) : null;
  const pdf = app.files.find((file) => file.kind === "pdf");

  return (
    <>
      <Breadcrumb
        items={[
          { href: "/", label: t("nav.home") },
          { href: "/services", label: t("nav.services") },
          { label: title },
        ]}
      />

      <div className="gov-container py-5 sm:py-7">
        {/* ------------------------------------------------------- the form */}
        <header className="mb-5">
          <p className="text-[13px] font-semibold uppercase tracking-wide text-crimson-600">
            {L("निवेदन फाराम", "Application form")}
          </p>
          <h1 className="page-title mt-1">{title}</h1>
          {alternate ? <p className="mt-0.5 text-[15px] text-ink-500">{alternate}</p> : null}
        </header>

        <div className="gov-card border-royal-200 bg-royal-50 p-4 sm:p-5">
          <ApplicationActions actions={actions} locale={locale} showView={false} />
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13.5px] text-ink-500">
            <Link href={`/services/${app.slug}/print`} className="inline-flex items-center gap-1.5 font-semibold text-royal-600 hover:underline">
              <IconPrint className="h-4 w-4" /> {L("खाली फाराम प्रिन्ट", "Print blank form")}
            </Link>
            {lead ? <span>{lead.original_name} · {humanSize(lead.size)}</span> : null}
          </div>
        </div>

        {app.is_sample ? (
          <p className="alert-warning mt-4 flex items-start gap-2 text-[14px]">
            <IconAlert className="mt-0.5 h-5 w-5 shrink-0" /> {t("app.sampleNotice")}
          </p>
        ) : null}

        {/* --------------------------------------------------- the document */}
        <section className="mt-6 min-w-0" aria-label={L("निवेदनको पूर्वावलोकन", "Application preview")}>
          {preview ? (
            <DocumentViewport pageWidth={preview.page.width} className="rounded-[6px] bg-line-100 p-3 sm:p-5">
              <DocumentPage html={preview.html} page={preview.page} />
            </DocumentViewport>
          ) : pdf ? (
            <object
              data={`/api/files/${pdf.id}#view=FitH`}
              type="application/pdf"
              className="h-[80vh] w-full rounded-[6px] border border-line-200 bg-line-100"
              aria-label={title}
            >
              <p className="p-5 text-[15px]">
                {L("यो ब्राउजरले PDF देखाउन सक्दैन।", "This browser cannot display the PDF.")}{" "}
                <a href={`/api/files/${pdf.id}?download=1`} className="font-semibold text-royal-600 hover:underline">
                  {L("डाउनलोड गर्नुहोस्", "Download it")}
                </a>
              </p>
            </object>
          ) : (
            <p className="gov-panel text-[15px] text-ink-500">
              {L(
                "यस निवेदनको फाइल अझै अपलोड गरिएको छैन।",
                "The file for this application has not been uploaded yet."
              )}
            </p>
          )}
        </section>

        {/* Repeat the actions after a long document, so nobody scrolls back. */}
        {preview || pdf ? (
          <div className="mt-5">
            <ApplicationActions actions={actions} locale={locale} showView={false} />
          </div>
        ) : null}

        {/* Other forms are navigation, not explanation — they help people find
            the right निवेदन when they have landed on a near miss. */}
        {related.length ? (
          <section className="mt-10 border-t border-line-200 pt-6">
            <h2 className="section-title mb-4">{L("मिल्दाजुल्दा निवेदन", "Related applications")}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((item) => (
                <ApplicationCard key={item.id} app={item} locale={locale} />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </>
  );
}
