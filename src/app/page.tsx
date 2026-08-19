import Link from "next/link";
import ApplicationCard from "@/components/ApplicationCard";
import SearchBox from "@/components/SearchBox";
import SetupNotice from "@/components/SetupNotice";
import { IconChevron } from "@/components/ui/Icons";
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

/**
 * The front of an application library.
 *
 * Search first, then the forms themselves — each one already carrying the
 * buttons that view, download and fill it. The ways of narrowing down
 * (category, section, ward) are chips beneath the forms rather than sections
 * of their own, because they are a route to a form, not a destination.
 */
export default async function HomePage() {
  const locale = await getLocale();
  const t = translator(locale);
  const L = (ne: string, en: string) => (locale === "en" ? en : ne);

  let data;
  try {
    const [categories, sections, wards, recent, total, popular] = await Promise.all([
      getCategories(), getSections(), getWards(), getRecentApplications(9),
      getPublishedCount(), getPopularSearches(6),
    ]);
    data = { categories, sections, wards, recent, total, popular };
  } catch (error) {
    return <SetupNotice error={error instanceof Error ? error.message : undefined} />;
  }

  const popular = data.popular.length >= 3 ? data.popular : FALLBACK_POPULAR;
  const count = locale === "ne" ? toNepaliDigits(data.total) : String(data.total);

  const chip =
    "rounded-full border border-line-200 bg-white px-3 py-1.5 text-[13.5px] text-ink-700 hover:border-royal-600 hover:text-royal-600";

  return (
    <>
      {/* ------------------------------------------------------------ search */}
      <section className="border-b border-line-200 bg-linear-to-b from-royal-50 to-white">
        <div className="gov-container py-9 sm:py-12">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="page-title">{t("home.heroTitle")}</h1>
            <p className="mx-auto mt-2.5 max-w-2xl text-[15.5px] text-ink-700 sm:text-[17px]">
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
                <Link key={term} href={`/services?q=${encodeURIComponent(term)}`} className={chip}>
                  {term}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ the forms */}
      <section className="gov-container py-8 sm:py-10">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="section-title">{t("home.recent")}</h2>
            <p className="mt-0.5 text-[13.5px] text-ink-500">
              {count} {t("home.totalServices")}
            </p>
          </div>
          <Link href="/services" className="btn-secondary btn-sm">
            {t("home.viewAll")} <IconChevron className="h-4 w-4" />
          </Link>
        </div>

        {data.recent.length ? (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.recent.map((app) => (
              <li key={app.id}><ApplicationCard app={app} locale={locale} /></li>
            ))}
          </ul>
        ) : (
          <p className="alert-info">
            {L(
              "अहिलेसम्म कुनै निवेदन प्रकाशित गरिएको छैन।",
              "No applications have been published yet."
            )}
          </p>
        )}
      </section>

      {/* --------------------------------------------------- ways to narrow */}
      <section className="border-t border-line-200 bg-surface-50 py-8">
        <div className="gov-container space-y-6">
          {[
            { title: t("home.browseCategory"), items: data.categories.map((c) => ({ key: c.id, href: `/services?category=${c.slug}`, label: pick(locale, c.name_ne, c.name_en) })) },
            { title: t("home.browseSection"), items: data.sections.map((s) => ({ key: s.id, href: `/services?section=${s.slug}`, label: pick(locale, s.name_ne, s.name_en) })) },
            {
              title: t("home.browseWard"),
              items: data.wards.map((w) => ({
                key: w.id,
                href: `/services?ward=${w.number}`,
                label: locale === "ne" ? `वडा ${toNepaliDigits(w.number)}` : `Ward ${w.number}`,
              })),
            },
          ].filter((group) => group.items.length).map((group) => (
            <div key={group.title}>
              <h2 className="mb-2.5 text-[15px] font-bold text-ink-700">{group.title}</h2>
              <ul className="flex flex-wrap gap-2">
                {group.items.map((item) => (
                  <li key={item.key}>
                    <Link href={item.href} className={chip}>{item.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
