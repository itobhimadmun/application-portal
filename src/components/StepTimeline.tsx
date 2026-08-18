import { pick, type Locale } from "@/lib/i18n";
import { toNepaliDigits } from "@/lib/translit";
import type { ApplicationStep } from "@/lib/types";

export default function StepTimeline({
  steps, locale,
}: { steps: ApplicationStep[]; locale: Locale }) {
  if (!steps.length) return null;

  return (
    <ol className="relative space-y-0">
      {steps.map((step, i) => {
        const last = i === steps.length - 1;
        return (
          <li key={step.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!last ? (
              <span aria-hidden="true" className="absolute left-[17px] top-9 h-[calc(100%-1.5rem)] w-0.5 bg-line-200" />
            ) : null}
            <span className="relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-royal-600 bg-white text-[15px] font-bold text-royal-600">
              {locale === "ne" ? toNepaliDigits(i + 1) : i + 1}
            </span>
            <div className="pt-1">
              <p className="text-[16px] font-semibold text-ink-900">
                {pick(locale, step.title_ne, step.title_en)}
              </p>
              {pick(locale, step.description_ne, step.description_en) ? (
                <p className="mt-0.5 text-[15px] text-ink-700">
                  {pick(locale, step.description_ne, step.description_en)}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
