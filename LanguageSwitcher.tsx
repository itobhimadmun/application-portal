"use client";

import { usePathname, useSearchParams } from "next/navigation";
import type { Locale } from "@/lib/i18n";

export default function LanguageSwitcher({ locale }: { locale: Locale }) {
  const pathname = usePathname();
  const params = useSearchParams();
  const query = params.toString();
  const next = encodeURIComponent(`${pathname}${query ? `?${query}` : ""}`);

  return (
    <div className="flex items-center gap-1" role="group" aria-label="Language / भाषा">
      <a
        href={`/api/lang?set=ne&next=${next}`}
        aria-current={locale === "ne" ? "true" : undefined}
        className={`rounded-[4px] px-2 py-0.5 ${locale === "ne" ? "bg-white font-bold text-crimson-700" : "font-semibold hover:underline"}`}
      >
        नेपाली
      </a>
      <span aria-hidden="true">|</span>
      <a
        href={`/api/lang?set=en&next=${next}`}
        aria-current={locale === "en" ? "true" : undefined}
        className={`rounded-[4px] px-2 py-0.5 ${locale === "en" ? "bg-white font-bold text-crimson-700" : "font-semibold hover:underline"}`}
      >
        English
      </a>
    </div>
  );
}
