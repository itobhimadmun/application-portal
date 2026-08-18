import Link from "next/link";
import ApplicationEditor from "@/components/admin/ApplicationEditor";
import SetupNotice from "@/components/SetupNotice";
import { getLocale, translator } from "@/lib/i18n";
import { getCategories, getSections, getWards } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function NewApplicationPage() {
  const locale = await getLocale();
  const t = translator(locale);

  let categories, sections, wards;
  try {
    [categories, sections, wards] = await Promise.all([getCategories(), getSections(), getWards()]);
  } catch (error) {
    return <SetupNotice error={error instanceof Error ? error.message : undefined} />;
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3">
        <h1 className="page-title">{t("admin.newApplication")}</h1>
        <Link href="/admin/applications" className="btn-outline btn-sm">{t("admin.applications")}</Link>
      </div>
      <p className="alert-info mb-5">
        {locale === "ne"
          ? "पहिले आधारभूत विवरण भरेर सुरक्षित गर्नुहोस्, त्यसपछि फाइल अपलोड गर्न सकिन्छ।"
          : "Save the basic details first — file uploads become available once the application exists."}
      </p>
      <ApplicationEditor
        locale={locale}
        categories={categories}
        sections={sections}
        wards={wards}
        application={null}
      />
    </div>
  );
}
