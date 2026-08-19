import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import OnlineForm from "@/components/OnlineForm";
import TemplateForm from "@/components/TemplateForm";
import { getLocale, translator, pick } from "@/lib/i18n";
import { getApplicationBySlug } from "@/lib/queries";
import { getSiteSettings } from "@/lib/settings";
import type { FormField } from "@/lib/types";

export const dynamic = "force-dynamic";

type Params = Promise<{ slug: string }>;

const DEFAULT_FIELDS: FormField[] = [
  { key: "name", label_ne: "निवेदकको नाम थर", label_en: "Applicant's full name", type: "text", required: true },
  { key: "address", label_ne: "ठेगाना", label_en: "Address", type: "text", required: true },
  { key: "ward", label_ne: "वडा नं.", label_en: "Ward no.", type: "text" },
  { key: "citizenship", label_ne: "नागरिकता प्रमाणपत्र नं.", label_en: "Citizenship certificate no.", type: "text" },
  { key: "phone", label_ne: "सम्पर्क नम्बर", label_en: "Contact number", type: "text" },
  { key: "purpose", label_ne: "प्रयोजन / व्यहोरा", label_en: "Purpose / details", type: "textarea" },
];

export default async function OnlineFormPage({ params }: { params: Params }) {
  const locale = await getLocale();
  const t = translator(locale);
  const site = await getSiteSettings();
  const { slug } = await params;

  const app = await getApplicationBySlug(slug);
  if (!app) notFound();

  // A Word template uploaded by the municipality always wins: filling it
  // returns their real document rather than a generic layout.
  const template = app.files.find((f) => f.is_template && (f.template_fields?.length ?? 0) > 0);
  if (!template && !app.online_form_enabled) notFound();

  const schema =
    Array.isArray(app.online_form_schema) && app.online_form_schema.length
      ? (app.online_form_schema as FormField[])
      : DEFAULT_FIELDS;

  return (
    <>
      <Breadcrumb
        items={[
          { href: "/", label: t("nav.home") },
          { href: "/services", label: t("nav.services") },
          { href: `/services/${app.slug}`, label: pick(locale, app.title_ne, app.title_en) },
          { label: t("doc.fillOnline") },
        ]}
      />
      <div className="gov-container py-6 sm:py-8">
        <div className="no-print mb-5 flex flex-wrap items-center justify-between gap-3">
          <h1 className="page-title">{pick(locale, app.title_ne, app.title_en)}</h1>
          <Link href={`/services/${app.slug}`} className="btn-outline btn-sm">{t("app.viewDetails")}</Link>
        </div>

        {template ? (
          <TemplateForm
            fileId={template.id}
            fields={template.template_fields}
            locale={locale}
            fileLabel={pick(locale, template.label_ne, template.label_en) || app.slug}
          />
        ) : (
          <OnlineForm
            fields={schema}
            locale={locale}
            title={pick(locale, app.title_ne, app.title_en)}
            subtitle={locale === "ne" ? app.title_en : app.title_ne}
            header={{
              line1: t("gov.nepal"),
              line2: locale === "en" ? site.nameEn : site.nameNe,
              line3: pick(locale, app.office_ne, app.office_en) || (locale === "en" ? site.addressEn : site.addressNe),
            }}
            footer={`${site.phone} · ${site.email}`}
            labels={{
              print: t("doc.print"),
              clear: locale === "ne" ? "खाली गर्नुहोस्" : "Clear",
              preview: t("doc.preview"),
              fill: t("doc.fillOnline"),
              date: locale === "ne" ? "मिति" : "Date",
              signature: locale === "ne" ? "निवेदकको दस्तखत" : "Applicant's signature",
            }}
          />
        )}
      </div>
    </>
  );
}
