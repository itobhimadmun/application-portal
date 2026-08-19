import Link from "next/link";
import { getLocale, translator } from "@/lib/i18n";
import { getSiteSettings } from "@/lib/settings";

export default async function SiteFooter() {
  const locale = await getLocale();
  const t = translator(locale);
  const site = await getSiteSettings();
  const year = new Date().getFullYear();

  return (
    <footer
      className="no-print mt-14 border-t-4 border-crimson-600 bg-royal-800 text-royal-100"
      data-print-hide
    >
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
            <li><Link href="/services" className="hover:underline">{t("search.title")}</Link></li>
            <li><Link href="/services?doc=word" className="hover:underline">{t("doc.downloadWord")}</Link></li>
            <li><Link href="/services?doc=pdf" className="hover:underline">{t("doc.downloadPdf")}</Link></li>
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
