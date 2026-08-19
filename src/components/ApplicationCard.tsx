import Link from "next/link";
import ApplicationActions, { actionsOf } from "./ApplicationActions";
import { pick, type Locale } from "@/lib/i18n";
import { toNepaliDigits } from "@/lib/translit";
import type { ApplicationSummary } from "@/lib/types";
import { IconDoc } from "./ui/Icons";

/**
 * One application in the library.
 *
 * The title names the form and the buttons sit directly beneath it, so the
 * whole card can be acted on without opening anything. Everything else — the
 * section, the wards it applies to — is a small line of context, not the
 * point of the card.
 */
export default function ApplicationCard({
  app, locale,
}: { app: ApplicationSummary; locale: Locale }) {
  const title = pick(locale, app.title_ne, app.title_en);
  const section = pick(locale, app.section_name_ne, app.section_name_en);
  const wards = app.all_wards
    ? (locale === "en" ? "All wards" : "सबै वडा")
    : app.ward_numbers
        .map((ward) => (locale === "ne" ? `वडा ${toNepaliDigits(ward)}` : `Ward ${ward}`))
        .join(", ");

  const context = [section, wards].filter(Boolean).join(" · ");

  return (
    <article className="gov-card flex h-full flex-col p-4 transition-shadow hover:shadow-[0_1px_3px_rgb(16_25_43/0.10),0_8px_20px_rgb(16_25_43/0.07)] sm:p-5">
      <div className="flex items-start gap-3">
        <span
          aria-hidden
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[6px] bg-crimson-50 text-crimson-600"
        >
          <IconDoc className="h-[18px] w-[18px]" />
        </span>
        <div className="min-w-0">
          <h3 className="text-[17px] font-bold leading-snug text-ink-900 sm:text-[18px]">
            <Link href={`/services/${app.slug}`} className="hover:text-royal-600 hover:underline">
              {title}
            </Link>
          </h3>
          {context ? <p className="mt-0.5 text-[13.5px] text-ink-500">{context}</p> : null}
        </div>
      </div>

      {/* Pushed to the bottom so every card in a row lines its buttons up. */}
      <div className="mt-auto pt-4">
        <ApplicationActions actions={actionsOf(app)} locale={locale} size="sm" />
      </div>
    </article>
  );
}
