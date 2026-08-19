import Link from "next/link";
import { Suspense } from "react";
import { getLocale, translator, type Locale } from "@/lib/i18n";
import { getSiteSettings } from "@/lib/settings";
import { getSessionUser } from "@/lib/auth";
import { logoutAction } from "@/lib/actions";
import MobileNav from "./MobileNav";
import LanguageSwitcher from "./LanguageSwitcher";
import { IconSettings } from "./ui/Icons";

export default async function SiteHeader() {
  const locale: Locale = await getLocale();
  const t = translator(locale);
  const site = await getSiteSettings();
  const user = await getSessionUser();

  const nav = [
    { href: "/", label: t("nav.home") },
    { href: "/services", label: t("nav.services") },
    { href: "/#categories", label: t("nav.categories") },
    { href: "/#sections", label: t("nav.sections") },
    { href: "/#wards", label: t("nav.wards") },
    { href: "/guide", label: t("nav.guide") },
  ];

  return (
    <header className="no-print">
      {/* Signed-in staff keep a way back to the dashboard from every public page. */}
      {user ? (
        <div className="bg-ink-900 text-white">
          <div className="gov-container flex flex-wrap items-center justify-between gap-2 py-1.5 text-[13px]">
            <span className="flex items-center gap-2">
              <IconSettings className="h-4 w-4" />
              {locale === "en"
                ? `Signed in as ${user.name || user.email}`
                : `${user.name || user.email} को रूपमा लगइन हुनुहुन्छ`}
            </span>
            <span className="flex items-center gap-3">
              <Link href="/admin" className="font-semibold underline-offset-2 hover:underline">
                {t("admin.dashboard")}
              </Link>
              <Link href="/admin/applications" className="hidden font-semibold underline-offset-2 hover:underline sm:inline">
                {t("admin.applications")}
              </Link>
              <form action={logoutAction}>
                <button type="submit" className="font-semibold underline-offset-2 hover:underline">
                  {t("admin.signOut")}
                </button>
              </form>
            </span>
          </div>
        </div>
      ) : null}

      {/* Government band */}
      <div className="bg-crimson-600 text-white">
        <div className="gov-container flex h-9 items-center justify-between text-[13px]">
          <span className="font-semibold tracking-wide">
            {t("gov.nepal")}
            {site.provinceNe || site.provinceEn ? (
              <span className="hidden sm:inline">
                {" · "}
                {locale === "en" ? site.provinceEn || site.provinceNe : site.provinceNe || site.provinceEn}
              </span>
            ) : null}
          </span>
          <div className="flex items-center gap-3">
            <Suspense fallback={<span className="px-2">नेपाली | English</span>}>
              <LanguageSwitcher locale={locale} />
            </Suspense>
          </div>
        </div>
      </div>

      {/* Identity band */}
      <div className="border-b border-line-200 bg-white">
        <div className="gov-container flex items-center gap-3 py-3 sm:gap-4 sm:py-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={site.logo} alt="" width={52} height={52} className="h-11 w-11 shrink-0 sm:h-14 sm:w-14" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-[17px] font-bold leading-tight text-ink-900 sm:text-[21px]">
              {locale === "en" ? site.nameEn : site.nameNe}
            </p>
            <p className="truncate text-[12.5px] text-ink-500 sm:text-[14px]">
              {locale === "en" ? site.nameNe : site.nameEn}
              {" · "}
              {locale === "en" ? site.portalNameEn : site.portalNameNe}
            </p>
          </div>
          <MobileNav items={nav} menuLabel={t("nav.menu")} closeLabel={t("nav.close")} />
        </div>
      </div>

      {/* Primary navigation */}
      <nav aria-label={t("nav.menu")} className="hidden bg-royal-600 text-white md:block">
        <div className="gov-container flex flex-wrap">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="px-4 py-3 text-[15px] font-semibold hover:bg-royal-700"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
