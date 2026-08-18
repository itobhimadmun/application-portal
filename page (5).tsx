import ActionForm from "@/components/admin/ActionForm";
import ConfirmButton from "@/components/admin/ConfirmButton";
import SetupNotice from "@/components/SetupNotice";
import { getLocale, translator, pick } from "@/lib/i18n";
import { getCategories, getSections, getWards } from "@/lib/queries";
import { saveCategory, saveSection, saveWard, deleteTaxonomy, createAdminUser } from "@/lib/actions";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

const ICONS = ["doc", "stamp", "user", "building", "map", "cash", "book", "heart", "tools", "grid"];

export default async function TaxonomyPage() {
  const locale = await getLocale();
  const t = translator(locale);
  const user = await getSessionUser();
  const L = (ne: string, en: string) => (locale === "en" ? en : ne);

  let categories, sections, wards;
  try {
    [categories, sections, wards] = await Promise.all([getCategories(), getSections(), getWards()]);
  } catch (error) {
    return <SetupNotice error={error instanceof Error ? error.message : undefined} />;
  }

  return (
    <div className="space-y-8">
      <h1 className="page-title">{t("admin.taxonomy")}</h1>

      {/* -------------------------------------------------------- categories */}
      <section className="gov-card p-5">
        <h2 className="mb-3 text-[17px] font-bold text-ink-900">{t("filter.category")}</h2>
        <ul className="mb-4 divide-y divide-line-100">
          {categories.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
              <span>
                <span className="font-medium text-ink-900">{pick(locale, c.name_ne, c.name_en)}</span>
                <span className="ml-2 text-[13px] text-ink-500">/{c.slug}</span>
              </span>
              <ConfirmButton
                action={deleteTaxonomy.bind(null, "category", c.id)}
                label={L("हटाउनुहोस्", "Remove")}
                confirmLabel={L("पक्का?", "Confirm")}
                cancelLabel={L("रद्द", "Cancel")}
              />
            </li>
          ))}
        </ul>
        <ActionForm action={saveCategory} submitLabel={L("थप्नुहोस्", "Add category")}>
          <div className="grid gap-3 sm:grid-cols-3">
            <input name="name_ne" className="gov-input" placeholder={L("नाम (नेपाली)", "Name (Nepali)")} />
            <input name="name_en" className="gov-input" placeholder={L("नाम (अंग्रेजी)", "Name (English)")} />
            <select name="icon" className="gov-select" defaultValue="doc">
              {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </ActionForm>
      </section>

      {/* ---------------------------------------------------------- sections */}
      <section className="gov-card p-5">
        <h2 className="mb-3 text-[17px] font-bold text-ink-900">{t("filter.section")}</h2>
        <ul className="mb-4 divide-y divide-line-100">
          {sections.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 py-2.5">
              <span>
                <span className="font-medium text-ink-900">{pick(locale, s.name_ne, s.name_en)}</span>
                <span className="ml-2 text-[13px] text-ink-500">/{s.slug}</span>
              </span>
              <ConfirmButton
                action={deleteTaxonomy.bind(null, "section", s.id)}
                label={L("हटाउनुहोस्", "Remove")}
                confirmLabel={L("पक्का?", "Confirm")}
                cancelLabel={L("रद्द", "Cancel")}
              />
            </li>
          ))}
        </ul>
        <ActionForm action={saveSection} submitLabel={L("थप्नुहोस्", "Add section")}>
          <div className="grid gap-3 sm:grid-cols-3">
            <input name="name_ne" className="gov-input" placeholder={L("नाम (नेपाली)", "Name (Nepali)")} />
            <input name="name_en" className="gov-input" placeholder={L("नाम (अंग्रेजी)", "Name (English)")} />
            <input name="contact" className="gov-input" placeholder={L("सम्पर्क", "Contact")} />
          </div>
        </ActionForm>
      </section>

      {/* ------------------------------------------------------------- wards */}
      <section className="gov-card p-5">
        <h2 className="mb-3 text-[17px] font-bold text-ink-900">{t("filter.ward")}</h2>
        <ul className="mb-4 flex flex-wrap gap-2">
          {wards.map((w) => (
            <li key={w.id} className="flex items-center gap-2 rounded-[6px] border border-line-200 px-3 py-1.5">
              <span className="text-[14px] font-medium">
                {locale === "en" ? `Ward ${w.number}` : `वडा ${w.number}`}
              </span>
              <ConfirmButton
                action={deleteTaxonomy.bind(null, "ward", w.id)}
                label="×"
                confirmLabel={L("पक्का?", "Confirm")}
                cancelLabel={L("रद्द", "Cancel")}
                className="btn-ghost btn-sm text-danger-600"
              />
            </li>
          ))}
        </ul>
        <ActionForm action={saveWard} submitLabel={L("थप्नुहोस् / अद्यावधिक", "Add / update ward")}>
          <div className="grid gap-3 sm:grid-cols-4">
            <input name="number" type="number" min="1" required className="gov-input" placeholder={L("वडा नं.", "Ward no.")} />
            <input name="office_ne" className="gov-input" placeholder={L("कार्यालय (नेपाली)", "Office (Nepali)")} />
            <input name="office_en" className="gov-input" placeholder={L("कार्यालय (अंग्रेजी)", "Office (English)")} />
            <input name="contact" className="gov-input" placeholder={L("सम्पर्क", "Contact")} />
          </div>
        </ActionForm>
      </section>

      {/* -------------------------------------------------------- admin users */}
      {user?.role === "admin" ? (
        <section className="gov-card p-5">
          <h2 className="mb-3 text-[17px] font-bold text-ink-900">{L("प्रशासक प्रयोगकर्ता", "Administrator accounts")}</h2>
          <ActionForm action={createAdminUser} submitLabel={L("प्रयोगकर्ता थप्नुहोस्", "Add user")}>
            <div className="grid gap-3 sm:grid-cols-4">
              <input name="name" className="gov-input" placeholder={L("नाम", "Name")} />
              <input name="email" type="email" required className="gov-input" placeholder="email@example.gov.np" />
              <input name="password" type="password" required minLength={8} className="gov-input" placeholder={L("पासवर्ड", "Password")} />
              <select name="role" className="gov-select" defaultValue="editor">
                <option value="editor">Editor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
          </ActionForm>
        </section>
      ) : null}
    </div>
  );
}
