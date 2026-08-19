import { cookies } from "next/headers";

export type Locale = "ne" | "en";
export const LOCALE_COOKIE = "portal_lang";
export const DEFAULT_LOCALE: Locale = "ne";

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const value = store.get(LOCALE_COOKIE)?.value;
  return value === "en" ? "en" : "ne";
}

type Dict = Record<string, { ne: string; en: string }>;

const dict = {
  // ---- global / chrome
  "nav.home": { ne: "गृहपृष्ठ", en: "Home" },
  "nav.services": { ne: "निवेदन तथा फारम", en: "Applications & Forms" },
  "nav.admin": { ne: "प्रशासक लगइन", en: "Admin Login" },
  "nav.menu": { ne: "मेनु", en: "Menu" },
  "nav.close": { ne: "बन्द गर्नुहोस्", en: "Close" },
  "gov.nepal": { ne: "नेपाल सरकार", en: "Government of Nepal" },
  "gov.localLevel": { ne: "स्थानीय तह", en: "Local Level" },

  // ---- home
  "home.heroTitle": { ne: "कुन निवेदन फाराम चाहियो?", en: "Which application form do you need?" },
  "home.heroSubtitle": {
    ne: "फाराम खोज्नुहोस् — हेर्नुहोस्, डाउनलोड गर्नुहोस्, वा अनलाइनै भरेर प्रिन्ट गर्नुहोस्।",
    en: "Find the form — view it, download it, or fill it in online and print it.",
  },
  "home.searchPlaceholder": { ne: "निवेदन वा फाराम खोज्नुहोस्…", en: "Search for an application or form…" },
  "home.search": { ne: "खोज्नुहोस्", en: "Search" },
  "home.popular": { ne: "प्रचलित खोजी", en: "Popular searches" },
  "home.browseCategory": { ne: "वर्ग अनुसार हेर्नुहोस्", en: "Browse by category" },
  "home.browseSection": { ne: "शाखा अनुसार हेर्नुहोस्", en: "Browse by section" },
  "home.browseWard": { ne: "वडा अनुसार हेर्नुहोस्", en: "Browse by ward" },
  "home.recent": { ne: "निवेदन तथा फारम", en: "Applications & forms" },
  "home.viewAll": { ne: "सबै हेर्नुहोस्", en: "View all" },
  "home.totalServices": { ne: "फाराम उपलब्ध", en: "forms available" },

  // ---- search / listing
  "search.title": { ne: "निवेदन तथा फारम", en: "Applications & Forms" },
  "search.resultsFor": { ne: "को खोजी नतिजा", en: "results for" },
  "search.count": { ne: "वटा निवेदन भेटियो", en: "applications found" },
  "search.noResults": { ne: "कुनै निवेदन भेटिएन", en: "No applications found" },
  "search.noResultsHelp": {
    ne: "अर्को शब्दले खोज्नुहोस् वा तलका वर्गहरूबाट हेर्नुहोस्।",
    en: "Try a different word, or browse the categories below.",
  },
  "search.suggestions": { ne: "यी खोज्न सक्नुहुन्छ", en: "You could try" },
  "filter.title": { ne: "छान्नुहोस्", en: "Filters" },
  "filter.category": { ne: "वर्ग", en: "Category" },
  "filter.section": { ne: "शाखा", en: "Section" },
  "filter.ward": { ne: "वडा", en: "Ward" },
  "filter.docType": { ne: "कागजातको प्रकार", en: "Document type" },
  "filter.all": { ne: "सबै", en: "All" },
  "filter.allWards": { ne: "सबै वडा", en: "All wards" },
  "filter.clear": { ne: "हटाउनुहोस्", en: "Clear" },
  "filter.apply": { ne: "लागू गर्नुहोस्", en: "Apply" },
  "filter.showFilters": { ne: "छनोट देखाउनुहोस्", en: "Show filters" },

  // ---- application card / detail
  "app.viewDetails": { ne: "निवेदन हेर्नुहोस्", en: "View application" },
  "app.section": { ne: "शाखा", en: "Section" },
  "app.forms": { ne: "निवेदन तथा फारम", en: "Applications & forms" },
  "app.noForms": { ne: "यस निवेदनको फाइल अझै अपलोड गरिएको छैन।", en: "The file for this application has not been uploaded yet." },
  "app.updatedOn": { ne: "अद्यावधिक मिति", en: "Last updated" },
  "app.sampleNotice": {
    ne: "यो नमुना प्रविष्टि हो — साँचो फाराम अपलोड गर्न बाँकी छ।",
    en: "This is a sample entry — the real form has not been uploaded yet.",
  },

  // ---- document actions
  "doc.download": { ne: "डाउनलोड", en: "Download" },
  "doc.downloadPdf": { ne: "PDF डाउनलोड", en: "Download PDF" },
  "doc.downloadWord": { ne: "Word डाउनलोड", en: "Download Word" },
  "doc.editableWord": { ne: "सम्पादनयोग्य Word", en: "Editable Word" },
  "doc.fillOnline": { ne: "अनलाइन भर्नुहोस्", en: "Fill online" },
  "doc.print": { ne: "प्रिन्ट गर्नुहोस्", en: "Print" },
  "doc.preview": { ne: "पूर्वावलोकन", en: "Preview" },
  "doc.format": { ne: "ढाँचा", en: "Format" },
  "doc.action": { ne: "कार्य", en: "Action" },
  "doc.document": { ne: "कागजात", en: "Document" },

  // ---- states
  "state.loading": { ne: "लोड हुँदैछ…", en: "Loading…" },
  "state.empty": { ne: "कुनै विवरण उपलब्ध छैन", en: "Nothing here yet" },
  "state.error": { ne: "केही समस्या आयो", en: "Something went wrong" },
  "state.setupNeeded": { ne: "पोर्टल सेटअप आवश्यक छ", en: "Portal setup required" },

  // ---- admin
  "admin.login": { ne: "प्रशासक लगइन", en: "Administrator login" },
  "admin.email": { ne: "इमेल", en: "Email" },
  "admin.password": { ne: "पासवर्ड", en: "Password" },
  "admin.signIn": { ne: "लगइन गर्नुहोस्", en: "Sign in" },
  "admin.signOut": { ne: "लगआउट", en: "Sign out" },
  "admin.dashboard": { ne: "ड्यासबोर्ड", en: "Dashboard" },
  "admin.applications": { ne: "निवेदन तथा सेवा", en: "Applications" },
  "admin.taxonomy": { ne: "वर्ग, शाखा र वडा", en: "Categories, sections & wards" },
  "admin.newApplication": { ne: "नयाँ निवेदन थप्नुहोस्", en: "Add application" },
  "admin.backToPortal": { ne: "पोर्टलमा फर्कनुहोस्", en: "Back to portal" },
  "admin.settings": { ne: "पोर्टल सेटिङ", en: "Portal settings" },
} satisfies Dict;

export type TranslationKey = keyof typeof dict;

export function translator(locale: Locale) {
  return (key: TranslationKey): string => dict[key][locale];
}

/** Pick the localised value of a bilingual record, falling back gracefully. */
export function pick(locale: Locale, ne?: string | null, en?: string | null): string {
  const primary = locale === "en" ? en : ne;
  const fallback = locale === "en" ? ne : en;
  return (primary && primary.trim()) || (fallback && fallback.trim()) || "";
}
