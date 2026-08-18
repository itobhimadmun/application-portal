import Link from "next/link";
import { getLocale, translator } from "@/lib/i18n";
import { site } from "@/lib/site";

export default async function SiteFooter() {
  const locale = await getLocale();
  const t = translator(locale);
  const year = new Date().getFullYear();

  return (
    <footer className="no-print mt-14 border-t-4 border-crimson-600 bg-royal-800 text-royal-100">
      <div className="gov-container grid gap-8 py-10 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <p className="text-[17px] font-bold text-white">
            {locale === "en" ? site.nameEn : site.nameNe}
          </p>
          <p className="mt-1 text-[14px]">{locale === "en" ? site.addressEn : site.addressNe}</p>
          <p className="mt-3 text-[14px]">
            <span className="block">{site.phone}</span>
            <a href={`mailto:${site.email}`} className="underline underline-offset-2">{site.email}</a>
          </p>
        </div>

        <div>
          <p className="mb-2 text-[15px] font-bold text-white">{t("nav.services")}</p>
          <ul className="space-y-1.5 text-[14px]">
            <li><Link href="/services" className="hover:underline">{t("nav.services")}</Link></li>
            <li><Link href="/#categories" className="hover:underline">{t("nav.categories")}</Link></li>
            <li><Link href="/#sections" className="hover:underline">{t("nav.sections")}</Link></li>
            <li><Link href="/#wards" className="hover:underline">{t("nav.wards")}</Link></li>
            <li><Link href="/guide" className="hover:underline">{t("nav.guide")}</Link></li>
          </ul>
        </div>

        <div>
          <p className="mb-2 text-[15px] font-bold text-white">{t("gov.localLevel")}</p>
          <ul className="space-y-1.5 text-[14px]">
            {site.website ? (
              <li><a href={site.website} className="hover:underline" rel="noreferrer">{site.website}</a></li>
            ) : null}
          </ul>
        </div>
      </div>

      <div className="border-t border-royal-700">
        <div className="gov-container py-4 text-[13px]">
          © {year} {locale === "en" ? site.nameEn : site.nameNe}. {t("gov.nepal")}.
        </div>
      </div>
    </footer>
  );
}
