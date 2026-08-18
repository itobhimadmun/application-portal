import Link from "next/link";
import ConfirmButton from "@/components/admin/ConfirmButton";
import SetupNotice from "@/components/SetupNotice";
import Pagination from "@/components/ui/Pagination";
import { getLocale, translator, pick } from "@/lib/i18n";
import { searchApplications, getSections } from "@/lib/queries";
import { setApplicationStatus, deleteApplication } from "@/lib/actions";
import { IconPlus, IconEye } from "@/components/ui/Icons";
import type { Status } from "@/lib/types";

export const dynamic = "force-dynamic";

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;
const KIND_ORDER = ["pdf", "word", "excel"] as const;

export default async function AdminApplicationsPage({
  searchParams,
}: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const locale = await getLocale();
  const t = translator(locale);
  const sp = await searchParams;

  const q = one(sp.q);
  const section = one(sp.section);
  const statusParam = one(sp.status);
  const status: Status | "any" =
    statusParam === "published" || statusParam === "draft" || statusParam === "archived" ? statusParam : "any";
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const perPage = 20;

  let result, sections;
  try {
    [result, sections] = await Promise.all([
      searchApplications({ q, section, status, page, perPage }),
      getSections(),
    ]);
  } catch (error) {
    return <SetupNotice error={error instanceof Error ? error.message : undefined} />;
  }

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (section) params.set("section", section);
    if (statusParam) params.set("status", statusParam);
    if (p > 1) params.set("page", String(p));
    const query = params.toString();
    return `/admin/applications${query ? `?${query}` : ""}`;
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">{t("admin.applications")}</h1>
        <Link href="/admin/applications/new" className="btn-primary">
          <IconPlus className="h-4 w-4" /> {t("admin.newApplication")}
        </Link>
      </div>

      <form method="get" className="gov-card mb-4 grid gap-3 p-4 sm:grid-cols-4">
        <input name="q" defaultValue={q ?? ""} placeholder={t("home.searchPlaceholder")} className="gov-input sm:col-span-2" />
        <select name="section" defaultValue={section ?? ""} className="gov-select">
          <option value="">{t("filter.all")} — {t("filter.section")}</option>
          {sections.map((s) => (
            <option key={s.id} value={s.slug}>{pick(locale, s.name_ne, s.name_en)}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <select name="status" defaultValue={statusParam ?? ""} className="gov-select">
            <option value="">{t("filter.all")}</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <button type="submit" className="btn-primary btn-sm">{t("filter.apply")}</button>
        </div>
      </form>

      <div className="gov-card overflow-x-auto">
        <table className="gov-table">
          <thead>
            <tr>
              <th scope="col">{locale === "ne" ? "निवेदन" : "Application"}</th>
              <th scope="col">{t("app.section")}</th>
              <th scope="col">{t("filter.ward")}</th>
              <th scope="col">{locale === "ne" ? "फाइल" : "Files"}</th>
              <th scope="col">{locale === "ne" ? "अवस्था" : "Status"}</th>
              <th scope="col" className="text-right">{t("doc.action")}</th>
            </tr>
          </thead>
          <tbody>
            {result.items.map((app) => (
              <tr key={app.id}>
                <td>
                  <Link href={`/admin/applications/${app.id}`} className="font-medium text-royal-600 hover:underline">
                    {pick(locale, app.title_ne, app.title_en)}
                  </Link>
                  <span className="block text-[13px] text-ink-500">/{app.slug}</span>
                </td>
                <td className="text-ink-500">{pick(locale, app.section_name_ne, app.section_name_en) || "—"}</td>
                <td className="text-ink-500">
                  {app.all_wards ? t("filter.allWards") : app.ward_numbers.join(", ") || "—"}
                </td>
                <td>
                  <span className="flex flex-wrap gap-1">
                    {KIND_ORDER.filter((k) => app.file_kinds.includes(k)).map((k) => (
                      <span key={k} className="badge-neutral">{k.toUpperCase()}</span>
                    ))}
                    {app.online_form_enabled ? <span className="badge-success">Online</span> : null}
                    {!app.file_kinds.length && !app.online_form_enabled ? <span className="text-ink-400">—</span> : null}
                  </span>
                </td>
                <td>
                  <span className={app.status === "published" ? "badge-success" : app.status === "draft" ? "badge-warning" : "badge-neutral"}>
                    {app.status}
                  </span>
                </td>
                <td>
                  <div className="flex flex-wrap justify-end gap-1.5">
                    <Link href={`/services/${app.slug}`} className="btn-outline btn-sm" title={t("doc.preview")}>
                      <IconEye className="h-4 w-4" />
                    </Link>
                    <Link href={`/admin/applications/${app.id}`} className="btn-outline btn-sm">
                      {locale === "ne" ? "सम्पादन" : "Edit"}
                    </Link>
                    {app.status === "published" ? (
                      <form action={setApplicationStatus.bind(null, app.id, "draft")}>
                        <button type="submit" className="btn-outline btn-sm">
                          {locale === "ne" ? "अप्रकाशित" : "Unpublish"}
                        </button>
                      </form>
                    ) : (
                      <form action={setApplicationStatus.bind(null, app.id, "published")}>
                        <button type="submit" className="btn-secondary btn-sm">
                          {locale === "ne" ? "प्रकाशित" : "Publish"}
                        </button>
                      </form>
                    )}
                    {app.status !== "archived" ? (
                      <form action={setApplicationStatus.bind(null, app.id, "archived")}>
                        <button type="submit" className="btn-outline btn-sm">
                          {locale === "ne" ? "संग्रह" : "Archive"}
                        </button>
                      </form>
                    ) : null}
                    <ConfirmButton
                      action={deleteApplication.bind(null, app.id)}
                      label={locale === "ne" ? "मेट्नुहोस्" : "Delete"}
                      confirmLabel={locale === "ne" ? "पक्का मेट्ने?" : "Confirm delete"}
                      cancelLabel={locale === "ne" ? "रद्द" : "Cancel"}
                    />
                  </div>
                </td>
              </tr>
            ))}
            {!result.items.length ? (
              <tr><td colSpan={6} className="py-8 text-center text-ink-500">{t("state.empty")}</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Pagination page={page} perPage={perPage} total={result.total} buildHref={buildHref} />
    </div>
  );
}
