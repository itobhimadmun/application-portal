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
  "nav.services": { ne: "सेवा तथा निवेदन", en: "Services & Forms" },
  "nav.categories": { ne: "वर्ग", en: "Categories" },
  "nav.sections": { ne: "शाखा", en: "Sections" },
  "nav.wards": { ne: "वडा", en: "Wards" },
  "nav.guide": { ne: "कसरी प्रयोग गर्ने?", en: "How to use" },
  "nav.admin": { ne: "प्रशासक लगइन", en: "Admin Login" },
  "nav.menu": { ne: "मेनु", en: "Menu" },
  "nav.close": { ne: "बन्द गर्नुहोस्", en: "Close" },
  "gov.nepal": { ne: "नेपाल सरकार", en: "Government of Nepal" },
  "gov.localLevel": { ne: "स्थानीय तह", en: "Local Level" },

  // ---- home
  "home.heroTitle": { ne: "तपाईंलाई कुन सेवा वा निवेदन चाहिएको छ?", en: "What service or application are you looking for?" },
  "home.heroSubtitle": {
    ne: "शाखा वा प्रक्रिया थाहा नभए पनि खोज्नुहोस् — आवश्यक निवेदन, कागजात र प्रक्रिया यहीँ भेटिन्छ।",
    en: "You do not need to know the department or the official name — search and find the right form, documents and process.",
  },
  "home.searchPlaceholder": { ne: "सेवा, निवेदन वा विषय खोज्नुहोस्…", en: "Search a service, application or topic…" },
  "home.search": { ne: "खोज्नुहोस्", en: "Search" },
  "home.popular": { ne: "प्रचलित खोजी", en: "Popular searches" },
  "home.browseCategory": { ne: "वर्ग अनुसार हेर्नुहोस्", en: "Browse by category" },
  "home.browseSection": { ne: "शाखा अनुसार हेर्नुहोस्", en: "Browse by section" },
  "home.browseWard": { ne: "वडा अनुसार हेर्नुहोस्", en: "Browse by ward" },
  "home.recent": { ne: "भर्खरै थपिएका / अद्यावधिक भएका", en: "Recently added or updated" },
  "home.howToUse": { ne: "यो पोर्टल कसरी प्रयोग गर्ने?", en: "How to use this portal" },
  "home.viewAll": { ne: "सबै हेर्नुहोस्", en: "View all" },
  "home.totalServices": { ne: "उपलब्ध सेवा", en: "Services available" },

  // ---- search / listing
  "search.title": { ne: "सेवा तथा निवेदन", en: "Services & Applications" },
  "search.resultsFor": { ne: "को खोजी नतिजा", en: "results for" },
  "search.count": { ne: "वटा सेवा भेटियो", en: "services found" },
  "search.noResults": { ne: "कुनै सेवा भेटिएन", en: "No services found" },
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
  "app.viewDetails": { ne: "विवरण हेर्नुहोस्", en: "View details" },
  "app.section": { ne: "शाखा", en: "Section" },
  "app.appliesAt": { ne: "आवेदन दिने स्थान", en: "Where to apply" },
  "app.documents": { ne: "आवश्यक कागजात", en: "Required documents" },
  "app.documentsCount": { ne: "कागजात", en: "documents" },
  "app.stepsCount": { ne: "चरण", en: "steps" },
  "app.about": { ne: "यो सेवा केका लागि हो?", en: "What is this service for?" },
  "app.process": { ne: "सेवा प्राप्त गर्ने प्रक्रिया", en: "How to get this service" },
  "app.forms": { ne: "निवेदन तथा फारम", en: "Applications & forms" },
  "app.relatedOffice": { ne: "सम्बन्धित कार्यालय", en: "Responsible office" },
  "app.fee": { ne: "दस्तुर", en: "Fee" },
  "app.duration": { ne: "लाग्ने समय", en: "Processing time" },
  "app.noForms": { ne: "यस सेवाका लागि कुनै फारम अपलोड गरिएको छैन।", en: "No form has been uploaded for this service yet." },
  "app.related": { ne: "मिल्दाजुल्दा सेवाहरू", en: "Related services" },
  "app.updatedOn": { ne: "अद्यावधिक मिति", en: "Last updated" },
  "app.sampleNotice": {
    ne: "यो नमुना सामग्री हो। प्रशासकले वास्तविक विवरण र फारमले प्रतिस्थापन गर्नुपर्छ।",
    en: "This is sample content. An administrator should replace it with the real details and forms.",
  },

  // ---- document actions
  "doc.download": { ne: "डाउनलोड", en: "Download" },
  "doc.downloadPdf": { ne: "PDF डाउनलोड", en: "Download PDF" },
  "doc.downloadWord": { ne: "Word डाउनलोड", en: "Download Word" },
  "doc.downloadExcel": { ne: "Excel डाउनलोड", en: "Download Excel" },
  "doc.editableWord": { ne: "सम्पादनयोग्य Word", en: "Editable Word" },
  "doc.fillOnline": { ne: "अनलाइन भर्नुहोस्", en: "Fill online" },
  "doc.print": { ne: "प्रिन्ट गर्नुहोस्", en: "Print" },
  "doc.preview": { ne: "पूर्वावलोकन", en: "Preview" },
  "doc.format": { ne: "ढाँचा", en: "Format" },
  "doc.action": { ne: "कार्य", en: "Action" },
  "doc.document": { ne: "कागजात", en: "Document" },

  // ---- guide
  "guide.step1": { ne: "आफूलाई चाहिने सेवा खोज्नुहोस्", en: "Search for the service you need" },
  "guide.step2": { ne: "सम्बन्धित निवेदन खोल्नुहोस्", en: "Open the matching application" },
  "guide.step3": { ne: "आवश्यक कागजात जाँच्नुहोस्", en: "Check the required documents" },
  "guide.step4": { ne: "प्रक्रिया पढ्नुहोस्", en: "Read the step-by-step process" },
  "guide.step5": { ne: "फारम डाउनलोड वा अनलाइन भर्नुहोस्", en: "Download or fill the form" },
  "guide.step6": { ne: "प्रिन्ट गरी सम्बन्धित कार्यालयमा पेश गर्नुहोस्", en: "Print it and submit at the office" },

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
