import Link from "next/link";
import { getSessionUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import { getLocale, translator } from "@/lib/i18n";
import { IconGrid, IconDoc, IconSettings } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();
  const locale = await getLocale();
  const t = translator(locale);

  // The login page renders inside this layout too, before a session exists.
  if (!user) return <>{children}</>;

  const nav = [
    { href: "/admin", label: t("admin.dashboard"), Icon: IconGrid },
    { href: "/admin/applications", label: t("admin.applications"), Icon: IconDoc },
    { href: "/admin/taxonomy", label: t("admin.taxonomy"), Icon: IconGrid },
    { href: "/admin/settings", label: t("admin.settings"), Icon: IconSettings },
  ];

  return (
    <div className="gov-container py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-line-200 pb-4">
        <div>
          <p className="text-[13px] uppercase tracking-wide text-ink-500">
            {locale === "en" ? "Administration" : "प्रशासन"}
          </p>
          <p className="text-[18px] font-bold text-ink-900">{user.name || user.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/" className="btn-outline btn-sm">{t("admin.backToPortal")}</Link>
          <form action={logoutAction}>
            <button type="submit" className="btn-danger btn-sm">{t("admin.signOut")}</button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav aria-label={t("admin.dashboard")} className="lg:sticky lg:top-4 lg:self-start">
          <ul className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1 lg:overflow-visible">
            {nav.map(({ href, label, Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className="flex items-center gap-2 whitespace-nowrap rounded-[6px] px-3 py-2.5 text-[15px] font-semibold text-ink-700 hover:bg-royal-50 hover:text-royal-600"
                >
                  <Icon className="h-4.5 w-4.5" /> {label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
