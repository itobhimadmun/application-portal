import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { downloadableWord } from "@/lib/preview";
import type { ApplicationFile, ApplicationSummary } from "@/lib/types";
import { IconDownload, IconEdit, IconEye } from "./ui/Icons";

/**
 * The four things this portal exists for. They appear on every card and at the
 * top of every application, so a visitor never has to read their way down to
 * reach the form.
 *
 * An action that cannot be performed is left out rather than shown disabled —
 * a greyed-out button invites a click that does nothing.
 */
export type ApplicationActionSet = {
  slug: string;
  wordFileId: number | null;
  pdfFileId: number | null;
  /** A template with labelled placeholders, so online filling is possible. */
  fillable: boolean;
  /** The portal can show the document itself, rather than only offer it. */
  viewable: boolean;
};

/** From a listing row, which already carries the four flags. */
export function actionsOf(app: ApplicationSummary): ApplicationActionSet {
  return {
    slug: app.slug,
    wordFileId: app.word_file_id,
    pdfFileId: app.pdf_file_id,
    fillable: app.fillable,
    viewable: app.viewable,
  };
}

/** From a loaded application, where the files are already in hand. */
export function actionsOfFiles(slug: string, files: ApplicationFile[]): ApplicationActionSet {
  return {
    slug,
    wordFileId: downloadableWord(files)?.id ?? null,
    pdfFileId: files.find((file) => file.kind === "pdf")?.id ?? null,
    fillable: files.some((file) => file.is_template && file.template_fields.length > 0),
    viewable: files.some((file) => file.kind === "pdf" || (file.kind === "word" && Boolean(file.preview_html))),
  };
}

const L = (locale: Locale, ne: string, en: string) => (locale === "en" ? en : ne);

export default function ApplicationActions({
  actions, locale, size = "md", showView = true,
}: {
  actions: ApplicationActionSet;
  locale: Locale;
  size?: "md" | "sm";
  /** Off on the application's own page, where the document is already open. */
  showView?: boolean;
}) {
  const { slug, wordFileId, pdfFileId, fillable, viewable } = actions;
  const small = size === "sm" ? " btn-sm" : "";
  const icon = size === "sm" ? "h-4 w-4" : "h-[18px] w-[18px]";

  if (!viewable && !wordFileId && !pdfFileId && !fillable) {
    return (
      <p className="text-[14px] text-ink-500">
        {L(locale, "फारम अपलोड हुन बाँकी छ।", "No form has been uploaded yet.")}
      </p>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showView && viewable ? (
        <Link href={`/services/${slug}`} className={`btn-secondary${small}`}>
          <IconEye className={icon} />
          {L(locale, "निवेदन हेर्नुहोस्", "View application")}
        </Link>
      ) : null}

      {pdfFileId ? (
        <a href={`/api/files/${pdfFileId}?download=1`} className={`btn-outline${small}`}>
          <IconDownload className={icon} /> PDF
        </a>
      ) : viewable ? (
        // No PDF was uploaded, so one is made from the form itself: this opens
        // the blank sheet with the print dialog already up, where the citizen
        // picks "Save as PDF".
        <Link href={`/services/${slug}/print?pdf=1`} className={`btn-outline${small}`}>
          <IconDownload className={icon} /> PDF
        </Link>
      ) : null}

      {/* A template downloads as a blank copy with ruled lines, never as
          {{placeholders}} — see the /api/files route. */}
      {wordFileId ? (
        <a href={`/api/files/${wordFileId}?download=1`} className={`btn-outline${small}`}>
          <IconDownload className={icon} /> Word
        </a>
      ) : null}

      {fillable ? (
        <Link href={`/services/${slug}/form`} className={`btn-crimson${small}`}>
          <IconEdit className={icon} />
          {L(locale, "अनलाइन भर्नुहोस्", "Fill online")}
        </Link>
      ) : null}
    </div>
  );
}
