import Link from "next/link";
import SetupNotice from "@/components/SetupNotice";
import { getLocale, translator, pick } from "@/lib/i18n";
import { toNepaliDigits } from "@/lib/translit";
import { getStats, searchApplications } from "@/lib/queries";
import { IconPlus } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const locale = await getLocale();
  const t = translator(locale);

  let stats, recent;
  try {
    stats = await getStats();
    recent = (await searchApplications({ status: "any", perPage: 8 })).items;
  } catch (error) {
    return <SetupNotice error={error instanceof Error ? error.message : undefined} />;
  }

  const num = (n: number) => (locale === "ne" ? toNepaliDigits(n) : String(n));

  const tiles = [
    { label: locale === "ne" ? "कुल निवेदन" : "Total applications", value: stats.total, tone: "text-ink-900" },
    { label: locale === "ne" ? "प्रकाशित" : "Published", value: stats.published, tone: "text-success-600" },
    { label: locale === "ne" ? "मस्यौदा" : "Draft", value: stats.draft, tone: "text-warning-600" },
    { label: locale === "ne" ? "संग्रहित" : "Archived", value: stats.archived, tone: "text-ink-500" },
    { label: locale === "ne" ? "वर्ग" : "Categories", value: stats.categories, tone: "text-ink-900" },
    { label: locale === "ne" ? "शाखा" : "Sections", value: stats.sections, tone: "text-ink-900" },
    { label: locale === "ne" ? "वडा" : "Wards", value: stats.wards, tone: "text-ink-900" },
    { label: locale === "ne" ? "अपलोड कागजात" : "Uploaded files", value: stats.files, tone: "text-ink-900" },
  ];

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h1 className="page-title">{t("admin.dashboard")}</h1>
        <Link href="/admin/applications/new" className="btn-primary">
          <IconPlus className="h-4 w-4" /> {t("admin.newApplication")}
        </Link>
      </div>

      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {tiles.map((tile) => (
          <li key={tile.label} className="gov-card p-4">
            <p className="text-[13px] text-ink-500">{tile.label}</p>
            <p className={`mt-1 text-[26px] font-bold ${tile.tone}`}>{num(tile.value)}</p>
          </li>
        ))}
      </ul>

      <h2 className="section-title mt-8 mb-3">
        {locale === "ne" ? "भर्खरै थपिएका / सम्पादित" : "Recently added or edited"}
      </h2>
      <div className="gov-card overflow-x-auto">
        <table className="gov-table">
          <thead>
            <tr>
              <th scope="col">{locale === "ne" ? "निवेदन" : "Application"}</th>
              <th scope="col">{t("app.section")}</th>
              <th scope="col">{locale === "ne" ? "अवस्था" : "Status"}</th>
              <th scope="col" className="text-right">{t("doc.action")}</th>
            </tr>
          </thead>
          <tbody>
            {recent.map((app) => (
              <tr key={app.id}>
                <td className="font-medium text-ink-900">{pick(locale, app.title_ne, app.title_en)}</td>
                <td className="text-ink-500">{pick(locale, app.section_name_ne, app.section_name_en) || "—"}</td>
                <td>
                  <span className={app.status === "published" ? "badge-success" : app.status === "draft" ? "badge-warning" : "badge-neutral"}>
                    {app.status}
                  </span>
                </td>
                <td className="text-right">
                  <Link href={`/admin/applications/${app.id}`} className="btn-outline btn-sm">
                    {locale === "ne" ? "सम्पादन" : "Edit"}
                  </Link>
                </td>
              </tr>
            ))}
            {!recent.length ? (
              <tr><td colSpan={4} className="py-6 text-center text-ink-500">{t("state.empty")}</td></tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
