import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import EmptyState from "@/components/ui/EmptyState";
import Filters from "@/components/Filters";
import Pagination from "@/components/ui/Pagination";
import SearchBox from "@/components/SearchBox";
import ApplicationCard from "@/components/ApplicationCard";
import SetupNotice from "@/components/SetupNotice";
import { getLocale, translator, pick } from "@/lib/i18n";
import { toNepaliDigits } from "@/lib/translit";
import { getCategories, getSections, getWards, searchApplications, logSearch } from "@/lib/queries";

export const dynamic = "force-dynamic";

type SP = Promise<Record<string, string | string[] | undefined>>;

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v) || undefined;

export default async function ServicesPage({ searchParams }: { searchParams: SP }) {
  const locale = await getLocale();
  const t = translator(locale);
  const sp = await searchParams;

  const q = one(sp.q)?.trim();
  const category = one(sp.category);
  const section = one(sp.section);
  const ward = one(sp.ward);
  const doc = one(sp.doc);
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const perPage = 12;

  let categories, sections, wards, result;
  try {
    [categories, sections, wards, result] = await Promise.all([
      getCategories(), getSections(), getWards(),
      searchApplications({ q, category, section, ward, doc, page, perPage }),
    ]);
  } catch (error) {
    return <SetupNotice error={error instanceof Error ? error.message : undefined} />;
  }

  if (q) await logSearch(q, result.total);

  const buildHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (category) params.set("category", category);
    if (section) params.set("section", section);
    if (ward) params.set("ward", ward);
    if (doc) params.set("doc", doc);
    if (p > 1) params.set("page", String(p));
    const query = params.toString();
    return `/services${query ? `?${query}` : ""}`;
  };

  const num = (n: number) => (locale === "ne" ? toNepaliDigits(n) : String(n));
  const activeCategory = categories.find((c) => c.slug === category);
  const activeSection = sections.find((s) => s.slug === section);

  return (
    <>
      <Breadcrumb
        items={[
          { href: "/", label: t("nav.home") },
          { label: q ? `“${q}”` : t("search.title") },
        ]}
      />

      <div className="gov-container py-6 sm:py-8">
        <h1 className="page-title">
          {q ? (locale === "ne" ? `“${q}” ${t("search.resultsFor")}` : `${t("search.resultsFor")} “${q}”`) : t("search.title")}
        </h1>
        <p className="mt-1 text-[15px] text-ink-500">
          {num(result.total)} {t("search.count")}
          {activeCategory ? ` · ${pick(locale, activeCategory.name_ne, activeCategory.name_en)}` : ""}
          {activeSection ? ` · ${pick(locale, activeSection.name_ne, activeSection.name_en)}` : ""}
          {ward ? ` · ${locale === "ne" ? `वडा ${toNepaliDigits(ward)}` : `Ward ${ward}`}` : ""}
        </p>

        <div className="mt-5 max-w-2xl">
          <SearchBox
            locale={locale}
            defaultValue={q ?? ""}
            placeholder={t("home.searchPlaceholder")}
            buttonLabel={t("home.search")}
            size="sm"
          />
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside>
            <Filters
              locale={locale}
              categories={categories}
              sections={sections}
              wards={wards}
              current={{ q, category, section, ward, doc }}
            />
          </aside>

          <div>
            {result.items.length ? (
              <>
                <ul className="grid gap-4 sm:grid-cols-2">
                  {result.items.map((app) => (
                    <li key={app.id}><ApplicationCard app={app} locale={locale} /></li>
                  ))}
                </ul>
                <Pagination page={page} perPage={perPage} total={result.total} buildHref={buildHref} />
              </>
            ) : (
              <EmptyState title={t("search.noResults")} description={t("search.noResultsHelp")}>
                <div className="flex flex-wrap justify-center gap-2">
                  {categories.slice(0, 6).map((c) => (
                    <Link key={c.id} href={`/services?category=${c.slug}`} className="btn-outline btn-sm">
                      {pick(locale, c.name_ne, c.name_en)}
                    </Link>
                  ))}
                </div>
              </EmptyState>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
