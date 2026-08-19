import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import FillWorkspace from "@/components/FillWorkspace";
import { getLocale, translator, pick } from "@/lib/i18n";
import { getPreview } from "@/lib/preview";
import { getApplicationBySlug } from "@/lib/queries";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

/**
 * Filling an application online.
 *
 * This only exists for a template the municipality has uploaded and labelled,
 * so what a citizen fills in and prints is the office's own document — not an
 * approximation of it.
 */
export default async function FillPage({ params }: { params: Params }) {
  const locale = await getLocale();
  const t = translator(locale);
  const { slug } = await params;
  const L = (ne: string, en: string) => (locale === "en" ? en : ne);

  const app = await getApplicationBySlug(slug);
  if (!app) notFound();

  const template = app.files.find(
    (file) => file.is_template && file.template_fields.length > 0
  );
  if (!template) notFound();

  const preview = await getPreview(template);
  if (!preview) notFound();

  const title = pick(locale, app.title_ne, app.title_en);

  return (
    <>
      <div data-print-hide>
        <Breadcrumb
          items={[
            { href: "/", label: t("nav.home") },
            { href: "/services", label: t("nav.services") },
            { href: `/services/${app.slug}`, label: title },
            { label: t("doc.fillOnline") },
          ]}
        />
      </div>

      <div className="gov-container py-5 sm:py-7">
        <header data-print-hide className="mb-5 flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold uppercase tracking-wide text-crimson-600">
              {L("निवेदन भर्नुहोस्", "Fill the application")}
            </p>
            <h1 className="page-title mt-1">{title}</h1>
          </div>
          <Link href={`/services/${app.slug}`} className="btn-outline btn-sm">
            {L("निवेदनमा फर्कनुहोस्", "Back to application")}
          </Link>
        </header>

        <FillWorkspace
          fileId={template.id}
          fields={template.template_fields}
          html={preview.html}
          page={preview.page}
          locale={locale}
          title={title}
          fileName={pick(locale, template.label_ne, template.label_en) || app.slug}
        />
      </div>
    </>
  );
}
