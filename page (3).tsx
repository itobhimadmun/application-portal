import Link from "next/link";
import { notFound } from "next/navigation";
import ApplicationEditor from "@/components/admin/ApplicationEditor";
import ConfirmButton from "@/components/admin/ConfirmButton";
import FileUploadForm from "@/components/admin/FileUploadForm";
import SetupNotice from "@/components/SetupNotice";
import { getLocale, translator, pick } from "@/lib/i18n";
import { getApplicationById, getCategories, getSections, getWards } from "@/lib/queries";
import { deleteApplicationFile, deleteApplication } from "@/lib/actions";
import { humanSize, MAX_UPLOAD_BYTES } from "@/lib/storage";
import { IconEye } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

type Params = Promise<{ id: string }>;

export default async function EditApplicationPage({
  params, searchParams,
}: { params: Params; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = await getLocale();
  const t = translator(locale);
  const { id } = await params;
  const sp = await searchParams;
  const applicationId = Number(id);
  if (!Number.isFinite(applicationId)) notFound();

  let application, categories, sections, wards;
  try {
    [application, categories, sections, wards] = await Promise.all([
      getApplicationById(applicationId), getCategories(), getSections(), getWards(),
    ]);
  } catch (error) {
    return <SetupNotice error={error instanceof Error ? error.message : undefined} />;
  }
  if (!application) notFound();

  const L = (ne: string, en: string) => (locale === "en" ? en : ne);

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="page-title">{pick(locale, application.title_ne, application.title_en)}</h1>
          <p className="text-[13.5px] text-ink-500">/services/{application.slug}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/services/${application.slug}`} className="btn-outline btn-sm">
            <IconEye className="h-4 w-4" /> {t("doc.preview")}
          </Link>
          <Link href="/admin/applications" className="btn-outline btn-sm">{t("admin.applications")}</Link>
          <ConfirmButton
            action={deleteApplication.bind(null, application.id)}
            label={L("मेट्नुहोस्", "Delete")}
            confirmLabel={L("पक्का मेट्ने?", "Confirm delete")}
            cancelLabel={L("रद्द", "Cancel")}
          />
        </div>
      </div>

      {sp.created ? <p className="alert-success mb-5">{L("निवेदन सिर्जना भयो।", "Application created.")}</p> : null}

      {/* ------------------------------------------------------------ files */}
      <section className="gov-card mb-6 p-5">
        <h2 className="text-[16px] font-bold text-ink-900">{L("फाइलहरू", "Files")}</h2>

        {application.files.length ? (
          <div className="mt-3 overflow-x-auto">
            <table className="gov-table">
              <thead>
                <tr>
                  <th scope="col">{t("doc.document")}</th>
                  <th scope="col">{t("doc.format")}</th>
                  <th scope="col">{L("आकार", "Size")}</th>
                  <th scope="col">{L("भण्डारण", "Storage")}</th>
                  <th scope="col" className="text-right">{t("doc.action")}</th>
                </tr>
              </thead>
              <tbody>
                {application.files.map((file) => (
                  <tr key={file.id}>
                    <td>
                      <span className="font-medium text-ink-900">
                        {pick(locale, file.label_ne, file.label_en) || file.original_name}
                      </span>
                      {file.is_editable ? <span className="ml-2 badge-royal">{t("doc.editableWord")}</span> : null}
                    </td>
                    <td><span className="badge-neutral">{file.kind.toUpperCase()}</span></td>
                    <td className="text-ink-500">{humanSize(file.size)}</td>
                    <td className="text-ink-500">{file.storage === "blob" ? "Blob" : "Postgres"}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <a href={`/api/files/${file.id}?download=1`} className="btn-outline btn-sm">
                          {t("doc.download")}
                        </a>
                        <ConfirmButton
                          action={deleteApplicationFile.bind(null, file.id, application.id)}
                          label={L("हटाउनुहोस्", "Remove")}
                          confirmLabel={L("पक्का?", "Confirm")}
                          cancelLabel={L("रद्द", "Cancel")}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-2 text-[14.5px] text-ink-500">{t("app.noForms")}</p>
        )}

        <div className="mt-5 border-t border-line-100 pt-4">
          <FileUploadForm
            applicationId={application.id}
            locale={locale}
            maxMb={Math.round(MAX_UPLOAD_BYTES / 1024 / 1024)}
          />
        </div>
      </section>

      <ApplicationEditor
        locale={locale}
        categories={categories}
        sections={sections}
        wards={wards}
        application={application}
      />
    </div>
  );
}
