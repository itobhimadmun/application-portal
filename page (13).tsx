import Link from "next/link";
import SearchBox from "@/components/SearchBox";
import ServiceCard from "@/components/ServiceCard";
import SetupNotice from "@/components/SetupNotice";
import { CATEGORY_ICONS, IconChevron, IconBuilding, IconMap, IconCheck } from "@/components/ui/Icons";
import { getLocale, translator, pick } from "@/lib/i18n";
import { toNepaliDigits } from "@/lib/translit";
import {
  getCategories, getSections, getWards, getRecentApplications,
  getPublishedCount, getPopularSearches,
} from "@/lib/queries";

export const dynamic = "force-dynamic";

const FALLBACK_POPULAR = [
  "नागरिकता सिफारिस", "जन्म दर्ता", "बसोबास सिफारिस", "व्यवसाय दर्ता", "घरबाटो सिफारिस", "नाता प्रमाणित",
];

export default async function HomePage() {
  const locale = await getLocale();
  const t = translator(locale);

  let data;
  try {
    const [categories, sections, wards, recent, total, popular] = await Promise.all([
      getCategories(), getSections(), getWards(), getRecentApplications(6),
      getPublishedCount(), getPopularSearches(6),
    ]);
    data = { categories, sections, wards, recent, total, popular };
  } catch (error) {
    return <SetupNotice error={error instanceof Error ? error.message : undefined} />;
  }

  const popular = data.popular.length >= 3 ? data.popular : FALLBACK_POPULAR;
  const num = (n: number) => (locale === "ne" ? toNepaliDigits(n) : String(n));

  const guideSteps = [
    t("guide.step1"), t("guide.step2"), t("guide.step3"),
    t("guide.step4"), t("guide.step5"), t("guide.step6"),
  ];

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="border-b border-line-200 bg-linear-to-b from-royal-50 to-white">
        <div className="gov-container py-10 sm:py-14">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="page-title">{t("home.heroTitle")}</h1>
            <p className="mx-auto mt-3 max-w-2xl text-[15.5px] text-ink-700 sm:text-[17px]">
              {t("home.heroSubtitle")}
            </p>

            <div className="mt-6 text-left">
              <SearchBox
                locale={locale}
                placeholder={t("home.searchPlaceholder")}
                buttonLabel={t("home.search")}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              <span className="text-[13.5px] font-semibold text-ink-500">{t("home.popular")}:</span>
              {popular.map((term) => (
                <Link
                  key={term}
                  href={`/services?q=${encodeURIComponent(term)}`}
                  className="rounded-full border border-line-200 bg-white px-3 py-1 text-[13.5px] text-ink-700 hover:border-royal-600 hover:text-royal-600"
                >
                  {term}
                </Link>
              ))}
            </div>

            <p className="mt-5 text-[13.5px] text-ink-500">
              {num(data.total)} {t("home.totalServices")}
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ categories */}
      <section id="categories" className="gov-container scroll-mt-4 py-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="section-title">{t("home.browseCategory")}</h2>
          <Link href="/services" className="btn-ghost btn-sm">{t("home.viewAll")}</Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {data.categories.map((c) => {
            const Icon = CATEGORY_ICONS[c.icon] ?? CATEGORY_ICONS.doc;
            return (
              <li key={c.id}>
                <Link
                  href={`/services?category=${c.slug}`}
                  className="gov-card flex h-full flex-col items-start gap-2 p-4 transition-colors hover:border-royal-600 hover:bg-royal-50"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-[6px] bg-royal-50 text-royal-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-[15px] font-semibold leading-snug text-ink-900">
                    {pick(locale, c.name_ne, c.name_en)}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* -------------------------------------------------------- sections */}
      <section id="sections" className="border-y border-line-200 bg-surface-50 py-10">
        <div className="gov-container scroll-mt-4">
          <h2 className="section-title mb-4">{t("home.browseSection")}</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {data.sections.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/services?section=${s.slug}`}
                  className="gov-card flex h-full items-start gap-3 p-4 hover:border-royal-600"
                >
                  <IconBuilding className="mt-0.5 h-5 w-5 shrink-0 text-royal-600" />
                  <span>
                    <span className="block text-[15.5px] font-semibold text-ink-900">
                      {pick(locale, s.name_ne, s.name_en)}
                    </span>
                    {pick(locale, s.description_ne, s.description_en) ? (
                      <span className="mt-0.5 block text-[13.5px] text-ink-500">
                        {pick(locale, s.description_ne, s.description_en)}
                      </span>
                    ) : null}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ----------------------------------------------------------- wards */}
      <section id="wards" className="gov-container scroll-mt-4 py-10">
        <h2 className="section-title mb-4">{t("home.browseWard")}</h2>
        <ul className="flex flex-wrap gap-2">
          <li>
            <Link href="/services" className="btn-outline btn-sm">
              <IconMap className="h-4 w-4" /> {t("filter.allWards")}
            </Link>
          </li>
          {data.wards.map((w) => (
            <li key={w.id}>
              <Link href={`/services?ward=${w.number}`} className="btn-outline btn-sm">
                {locale === "ne" ? `वडा ${toNepaliDigits(w.number)}` : `Ward ${w.number}`}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------------- how to use */}
      <section className="border-y border-line-200 bg-royal-800 py-10 text-white">
        <div className="gov-container">
          <h2 className="text-[20px] font-bold sm:text-[22px]">{t("home.howToUse")}</h2>
          <ol className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {guideSteps.map((step, i) => (
              <li key={i} className="flex items-start gap-3 rounded-[6px] bg-royal-700/60 p-4">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white text-[14px] font-bold text-royal-700">
                  {locale === "ne" ? toNepaliDigits(i + 1) : i + 1}
                </span>
                <span className="text-[15px] leading-snug">{step}</span>
              </li>
            ))}
          </ol>
          <Link href="/guide" className="btn-crimson mt-5 inline-flex">
            {t("nav.guide")} <IconChevron className="h-4 w-4" />
          </Link>
        </div>
      </section>

      {/* ---------------------------------------------------------- recent */}
      <section className="gov-container py-10">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="section-title">{t("home.recent")}</h2>
          <Link href="/services" className="btn-ghost btn-sm">
            {t("home.viewAll")} <IconChevron className="h-4 w-4" />
          </Link>
        </div>
        {data.recent.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.recent.map((app) => (
              <li key={app.id}><ServiceCard app={app} locale={locale} /></li>
            ))}
          </ul>
        ) : (
          <div className="alert-info">
            <p className="flex items-center gap-2">
              <IconCheck className="h-5 w-5" />
              {locale === "ne"
                ? "अहिलेसम्म कुनै सेवा प्रकाशित गरिएको छैन। प्रशासक लगइन गरेर निवेदन थप्नुहोस्।"
                : "No services published yet. Sign in as an administrator to add applications."}
            </p>
          </div>
        )}
      </section>
    </>
  );
}
