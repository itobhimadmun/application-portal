import Link from "next/link";
import { getLocale, translator } from "@/lib/i18n";

export default async function NotFound() {
  const locale = await getLocale();
  const t = translator(locale);

  return (
    <div className="gov-container flex max-w-xl flex-col items-center py-20 text-center">
      <p className="text-[52px] font-bold text-royal-600">404</p>
      <h1 className="mt-2 text-[22px] font-bold text-ink-900">
        {locale === "ne" ? "पृष्ठ भेटिएन" : "Page not found"}
      </h1>
      <p className="mt-2 text-[15px] text-ink-500">
        {locale === "ne"
          ? "तपाईंले खोज्नुभएको पृष्ठ हटाइएको वा सारिएको हुन सक्छ।"
          : "The page you are looking for may have been moved or removed."}
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-2">
        <Link href="/" className="btn-primary">{t("nav.home")}</Link>
        <Link href="/services" className="btn-outline">{t("nav.services")}</Link>
      </div>
    </div>
  );
}
