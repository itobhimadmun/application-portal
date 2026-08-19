import Link from "next/link";
import { notFound } from "next/navigation";
import DocumentPage from "@/components/DocumentPage";
import DocumentViewport from "@/components/DocumentViewport";
import PrintButton from "@/components/PrintButton";
import { getLocale, translator, pick } from "@/lib/i18n";
import { getPreview, primaryFile } from "@/lib/preview";
import { getApplicationBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

/**
 * The blank form, alone on the page and ready for the printer.
 *
 * Everything but the document is marked as screen-only, and the page box
 * supplies the margins the Word file specified, so the sheet that comes out
 * matches the official form rather than a web page about it.
 */
export default async function PrintPage({ params }: { params: Params }) {
  const locale = await getLocale();
  const t = translator(locale);
  const { slug } = await params;
  const L = (ne: string, en: string) => (locale === "en" ? en : ne);

  const app = await getApplicationBySlug(slug);
  if (!app) notFound();

  const lead = primaryFile(app.files);
  const preview = lead ? await getPreview(lead) : null;
  const title = pick(locale, app.title_ne, app.title_en);

  if (!preview) {
    const pdf = app.files.find((file) => file.kind === "pdf");
    return (
      <div className="gov-container max-w-3xl py-8 text-center">
        <h1 className="page-title">{title}</h1>
        <p className="mt-3 text-[15px] text-ink-500">
          {pdf
            ? L("यो निवेदन PDF मा छ — डाउनलोड गरेर प्रिन्ट गर्नुहोस्।",
                "This application is a PDF — download it and print from your PDF reader.")
            : L("यस निवेदनको फाइल अझै अपलोड गरिएको छैन।",
                "The file for this application has not been uploaded yet.")}
        </p>
        <div className="mt-5 flex justify-center gap-2">
          {pdf ? (
            <a href={`/api/files/${pdf.id}?download=1`} className="btn-primary">
              {t("doc.downloadPdf")}
            </a>
          ) : null}
          <Link href={`/services/${app.slug}`} className="btn-outline">
            {L("निवेदनमा फर्कनुहोस्", "Back to application")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <style>{"@media print{@page{margin:0}}"}</style>

      <div className="gov-container py-5">
        <div data-print-hide className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-bold text-ink-900">{title}</h1>
            <p className="text-[13.5px] text-ink-500">
              {L("खाली फाराम — प्रिन्ट गरेर हातले भर्न सकिन्छ।",
                 "Blank form — print it and complete it by hand.")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <PrintButton label={t("doc.print")} className="btn-crimson" />
            <Link href={`/services/${app.slug}/form`} className="btn-secondary">
              {t("doc.fillOnline")}
            </Link>
            <Link href={`/services/${app.slug}`} className="btn-outline">
              {L("फर्कनुहोस्", "Back")}
            </Link>
          </div>
        </div>

        <DocumentViewport pageWidth={preview.page.width} className="rounded-[6px] bg-line-100 p-3 sm:p-5">
          <DocumentPage html={preview.html} page={preview.page} />
        </DocumentViewport>
      </div>
    </>
  );
}
