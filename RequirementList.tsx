import { pick, type Locale } from "@/lib/i18n";
import { toNepaliDigits } from "@/lib/translit";
import type { RequiredDocument } from "@/lib/types";

export default function RequirementList({
  items, locale,
}: { items: RequiredDocument[]; locale: Locale }) {
  if (!items.length) return null;

  return (
    <ul className="divide-y divide-line-100 rounded-[6px] border border-line-200">
      {items.map((doc, i) => (
        <li key={doc.id} className="flex items-start gap-3 px-4 py-3">
          <span
            aria-hidden="true"
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[4px] border border-line-200 bg-surface-50 text-[13px] font-bold text-ink-500"
          >
            {locale === "ne" ? toNepaliDigits(i + 1) : i + 1}
          </span>
          <span className="flex-1">
            <span className="block text-[15.5px] font-medium text-ink-900">
              {pick(locale, doc.label_ne, doc.label_en)}
              {!doc.is_required ? (
                <span className="ml-2 badge-neutral">{locale === "ne" ? "ऐच्छिक" : "Optional"}</span>
              ) : null}
            </span>
            {pick(locale, doc.note_ne, doc.note_en) ? (
              <span className="mt-0.5 block text-[13.5px] text-ink-500">
                {pick(locale, doc.note_ne, doc.note_en)}
              </span>
            ) : null}
          </span>
        </li>
      ))}
    </ul>
  );
}
