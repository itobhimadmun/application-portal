"use client";

import { useActionState } from "react";
import { resetLogo, uploadLogo, type ActionState } from "@/lib/actions";
import { BRANDING_ACCEPT, MAX_BRANDING_BYTES } from "@/lib/branding-formats";
import type { Locale } from "@/lib/i18n";
import { IconAlert } from "@/components/ui/Icons";

/**
 * Replacing the municipality's emblem.
 *
 * The image is stored in the database and served from a stable URL, so this
 * needs no access to the repository and no deployment — which is the whole
 * point: an administrator should be able to put the right emblem up on the day
 * they have it.
 */
export default function LogoUploader({
  locale, current, isDefault, name,
}: {
  locale: Locale;
  /** Where the emblem is served from today. */
  current: string;
  /** True while the portal is still showing the placeholder that ships with it. */
  isDefault: boolean;
  name: string;
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(uploadLogo, {});
  const L = (ne: string, en: string) => (locale === "en" ? en : ne);
  const maxKb = Math.round(MAX_BRANDING_BYTES / 1024);

  return (
    <section className="gov-card mt-5 p-5">
      <h2 className="text-[16px] font-bold text-ink-900">{L("नगरपालिकाको छाप", "Municipal emblem")}</h2>
      <p className="mt-1 text-[13.5px] text-ink-500">
        {L(
          "हेडर, फुटर र प्रिन्ट हुने पानामा देखिने छाप। अपलोड गरेपछि तुरुन्तै सबै ठाउँमा बदलिन्छ।",
          "Shown in the header, the footer and on printed sheets. It changes everywhere as soon as you upload it."
        )}
      </p>

      {state.error ? (
        <p className="alert-danger mt-4 flex items-start gap-2" role="alert">
          <IconAlert className="mt-0.5 h-5 w-5 shrink-0" /> {state.error}
        </p>
      ) : null}
      {state.ok ? <p className="alert-success mt-4" role="status">{state.message}</p> : null}

      <div className="mt-4 flex flex-wrap items-start gap-5">
        <figure className="shrink-0 text-center">
          <span className="flex h-24 w-24 items-center justify-center rounded-[6px] border border-line-200 bg-surface-50 p-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current} alt={name} className="max-h-full max-w-full" />
          </span>
          <figcaption className="mt-1.5 text-[12.5px] text-ink-500">
            {isDefault ? L("नमुना छाप", "Placeholder") : L("हालको छाप", "Current")}
          </figcaption>
        </figure>

        <form action={action} className="min-w-[260px] flex-1 space-y-3">
          <div>
            <label className="gov-label" htmlFor="logo_file">
              {L("नयाँ छाप छान्नुहोस्", "Choose a new emblem")}
            </label>
            <input
              id="logo_file"
              name="logo_file"
              type="file"
              required
              accept={BRANDING_ACCEPT}
              className="gov-input py-2"
            />
            <span className="gov-hint">
              {L(
                `SVG, PNG, JPEG वा WebP · ${maxKb} KB सम्म · वर्गाकार भए राम्रो देखिन्छ`,
                `SVG, PNG, JPEG or WebP · up to ${maxKb} KB · a square image sits best`
              )}
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={pending} className="btn-primary">
              {pending ? L("अपलोड हुँदैछ…", "Uploading…") : L("छाप अपलोड गर्नुहोस्", "Upload emblem")}
            </button>
            {!isDefault ? (
              <button type="submit" formAction={resetLogo} formNoValidate className="btn-outline">
                {L("नमुना छापमा फर्कनुहोस्", "Back to the placeholder")}
              </button>
            ) : null}
          </div>
        </form>
      </div>
    </section>
  );
}
