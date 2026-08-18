import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { getLocale, translator } from "@/lib/i18n";
import { toNepaliDigits } from "@/lib/translit";
import { IconSearch, IconDoc, IconCheck, IconClock, IconDownload, IconPrint } from "@/components/ui/Icons";

export const dynamic = "force-dynamic";

export default async function GuidePage() {
  const locale = await getLocale();
  const t = translator(locale);

  const steps = [
    { icon: IconSearch, label: t("guide.step1"),
      help: locale === "ne"
        ? "आधिकारिक नाम थाहा नभए पनि हुन्छ — 'घर बनाउने', 'जन्म', 'बाटो' जस्ता साधारण शब्द लेखे पुग्छ।"
        : "You do not need the official name — plain words like “build a house”, “birth” or “road” are enough." },
    { icon: IconDoc, label: t("guide.step2"),
      help: locale === "ne"
        ? "नतिजाबाट मिल्दो निवेदन छान्नुहोस्। हरेक कार्डमा शाखा र वडा देखिन्छ।"
        : "Pick the matching application from the results. Each card shows the section and ward." },
    { icon: IconCheck, label: t("guide.step3"),
      help: locale === "ne"
        ? "कार्यालय जानुअघि सूचीका सबै कागजात तयार पार्नुहोस्।"
        : "Prepare every document on the checklist before visiting the office." },
    { icon: IconClock, label: t("guide.step4"),
      help: locale === "ne"
        ? "कति चरण छन्, कति समय लाग्छ र कति दस्तुर लाग्छ भन्ने पृष्ठमै लेखिएको छ।"
        : "The page shows how many steps there are, how long it takes and what it costs." },
    { icon: IconDownload, label: t("guide.step5"),
      help: locale === "ne"
        ? "PDF, Word वा Excel डाउनलोड गर्नुहोस्, वा उपलब्ध भएमा अनलाइन नै भर्नुहोस्।"
        : "Download the PDF, Word or Excel copy — or fill it online where that is available." },
    { icon: IconPrint, label: t("guide.step6"),
      help: locale === "ne"
        ? "प्रिन्ट गरी हस्ताक्षर सहित सम्बन्धित वडा वा शाखामा बुझाउनुहोस्।"
        : "Print it, sign it and submit it at the relevant ward office or section." },
  ];

  return (
    <>
      <Breadcrumb items={[{ href: "/", label: t("nav.home") }, { label: t("nav.guide") }]} />
      <div className="gov-container max-w-4xl py-8">
        <h1 className="page-title">{t("home.howToUse")}</h1>
        <p className="mt-2 text-[16px] text-ink-700">{t("home.heroSubtitle")}</p>

        <ol className="mt-8 space-y-4">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <li key={i} className="gov-card flex items-start gap-4 p-5">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-royal-50 text-royal-600">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[17px] font-bold text-ink-900">
                    {locale === "ne" ? `${toNepaliDigits(i + 1)}. ` : `${i + 1}. `}{step.label}
                  </p>
                  <p className="mt-1 text-[15px] text-ink-700">{step.help}</p>
                </div>
              </li>
            );
          })}
        </ol>

        <div className="mt-8">
          <Link href="/services" className="btn-crimson">{t("nav.services")}</Link>
        </div>
      </div>
    </>
  );
}
