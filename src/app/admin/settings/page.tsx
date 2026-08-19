import ActionForm from "@/components/admin/ActionForm";
import SetupNotice from "@/components/SetupNotice";
import { getLocale, translator } from "@/lib/i18n";
import { getSiteSettings } from "@/lib/settings";
import { getSessionUser } from "@/lib/auth";
import { saveSettings } from "@/lib/actions";

export const dynamic = "force-dynamic";

/**
 * One place to rename the municipality everywhere in the portal — header,
 * footer, page titles, printed sheets and the browser tab.
 */
export default async function SettingsPage() {
  const locale = await getLocale();
  const t = translator(locale);
  const user = await getSessionUser();
  const L = (ne: string, en: string) => (locale === "en" ? en : ne);

  let site;
  try {
    site = await getSiteSettings();
  } catch (error) {
    return <SetupNotice error={error instanceof Error ? error.message : undefined} />;
  }

  if (user?.role !== "admin") {
    return (
      <div>
        <h1 className="page-title">{t("admin.settings")}</h1>
        <p className="alert-warning mt-4">
          {L("यो पृष्ठ प्रशासक (admin) भूमिका भएकाले मात्र खोल्न सक्नुहुन्छ।",
             "Only a user with the administrator role can change these settings.")}
        </p>
      </div>
    );
  }

  const field = (
    name: keyof typeof site,
    labelNe: string,
    labelEn: string,
    hint?: { ne: string; en: string }
  ) => (
    <div>
      <label className="gov-label" htmlFor={name}>{L(labelNe, labelEn)}</label>
      <input id={name} name={name} defaultValue={site[name]} className="gov-input" />
      {hint ? <span className="gov-hint">{L(hint.ne, hint.en)}</span> : null}
    </div>
  );

  return (
    <div>
      <h1 className="page-title">{t("admin.settings")}</h1>
      <p className="mt-1 text-[15px] text-ink-500">
        {L(
          "यहाँ बदलेको नाम पोर्टलका सबै पृष्ठ, प्रिन्ट पाना र ब्राउजर शीर्षकमा तुरुन्तै लागू हुन्छ।",
          "A change here applies immediately across every page, printed sheet and browser title."
        )}
      </p>

      <ActionForm action={saveSettings} submitLabel={L("सुरक्षित गर्नुहोस्", "Save settings")} className="mt-5 space-y-6">
        <fieldset className="gov-card p-5">
          <legend className="px-1 text-[16px] font-bold text-ink-900">
            {L("नगरपालिकाको नाम", "Municipality name")}
          </legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {field("nameNe", "नाम (नेपाली)", "Name (Nepali)")}
            {field("nameEn", "नाम (अंग्रेजी)", "Name (English)")}
            {field("portalNameNe", "पोर्टलको नाम (नेपाली)", "Portal name (Nepali)")}
            {field("portalNameEn", "पोर्टलको नाम (अंग्रेजी)", "Portal name (English)")}
          </div>
        </fieldset>

        <fieldset className="gov-card p-5">
          <legend className="px-1 text-[16px] font-bold text-ink-900">
            {L("ठेगाना", "Address")}
          </legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {field("addressNe", "ठेगाना (नेपाली)", "Address (Nepali)")}
            {field("addressEn", "ठेगाना (अंग्रेजी)", "Address (English)")}
            {field("districtNe", "जिल्ला (नेपाली)", "District (Nepali)")}
            {field("districtEn", "जिल्ला (अंग्रेजी)", "District (English)")}
            {field("provinceNe", "प्रदेश (नेपाली)", "Province (Nepali)")}
            {field("provinceEn", "प्रदेश (अंग्रेजी)", "Province (English)")}
          </div>
        </fieldset>

        <fieldset className="gov-card p-5">
          <legend className="px-1 text-[16px] font-bold text-ink-900">
            {L("सम्पर्क तथा लोगो", "Contact and logo")}
          </legend>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {field("phone", "फोन", "Phone")}
            {field("email", "इमेल", "Email")}
            {field("website", "वेबसाइट", "Website")}
            {field("logo", "लोगोको ठेगाना", "Logo path", {
              ne: "public फोल्डरमा राखेको फाइल, जस्तै /logo.png",
              en: "A file placed in the public folder, e.g. /logo.png",
            })}
          </div>
        </fieldset>
      </ActionForm>
    </div>
  );
}
