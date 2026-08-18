import Link from "next/link";
import { pick, translator, type Locale } from "@/lib/i18n";
import { humanSize } from "@/lib/storage";
import type { ApplicationFile } from "@/lib/types";
import { IconDownload, IconEdit, IconEye, IconPrint } from "./ui/Icons";

const KIND_LABEL: Record<string, string> = { pdf: "PDF", word: "Word", excel: "Excel", other: "File" };

export default function DocumentActions({
  files, locale, slug, onlineForm,
}: { files: ApplicationFile[]; locale: Locale; slug: string; onlineForm: boolean }) {
  const t = translator(locale);

  if (!files.length && !onlineForm) {
    return <p className="alert-info">{t("app.noForms")}</p>;
  }

  return (
    <div className="space-y-4">
      {files.length ? (
        <div className="overflow-x-auto rounded-[6px] border border-line-200">
          <table className="gov-table">
            <caption className="sr-only">{t("app.forms")}</caption>
            <thead>
              <tr>
                <th scope="col">{t("doc.document")}</th>
                <th scope="col">{t("doc.format")}</th>
                <th scope="col" className="text-right">{t("doc.action")}</th>
              </tr>
            </thead>
            <tbody>
              {files.map((file) => (
                <tr key={file.id}>
                  <td>
                    <span className="block font-medium text-ink-900">
                      {pick(locale, file.label_ne, file.label_en) || file.original_name}
                    </span>
                    <span className="block text-[13px] text-ink-500">
                      {humanSize(file.size)}
                      {file.is_editable ? ` · ${t("doc.editableWord")}` : ""}
                    </span>
                  </td>
                  <td><span className="badge-neutral">{KIND_LABEL[file.kind] ?? file.kind}</span></td>
                  <td>
                    <div className="flex flex-wrap justify-end gap-2">
                      {file.kind === "pdf" ? (
                        <a href={`/api/files/${file.id}`} target="_blank" rel="noreferrer" className="btn-outline btn-sm">
                          <IconEye className="h-4 w-4" /> {t("doc.preview")}
                        </a>
                      ) : null}
                      <a href={`/api/files/${file.id}?download=1`} className="btn-primary btn-sm">
                        {file.is_editable ? <IconEdit className="h-4 w-4" /> : <IconDownload className="h-4 w-4" />}
                        {t("doc.download")}
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        {onlineForm ? (
          <Link href={`/services/${slug}/form`} className="btn-crimson">
            <IconEdit className="h-4 w-4" /> {t("doc.fillOnline")}
          </Link>
        ) : null}
        <Link href={`/services/${slug}/print`} className="btn-outline">
          <IconPrint className="h-4 w-4" /> {t("doc.print")}
        </Link>
      </div>
    </div>
  );
}
