"use client";

import { useEffect, useState } from "react";
import { IconPrint } from "./ui/Icons";

/**
 * Opens the browser's print dialog — which is also how a PDF is produced, by
 * choosing "Save as PDF" as the destination.
 *
 * With `auto`, the dialog opens on arrival: someone who clicked a PDF button on
 * the previous page has already asked for it, and making them click a second
 * time would be a step for its own sake.
 */
export default function PrintButton({
  label, className = "btn-outline", auto = false, hint,
}: {
  label: string;
  className?: string;
  auto?: boolean;
  /** Shown when the dialog is opened for a PDF, explaining what to pick. */
  hint?: string;
}) {
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    if (!auto) return;
    setShowHint(Boolean(hint));
    // Let the document finish laying out before the dialog freezes the page.
    const timer = setTimeout(() => window.print(), 350);
    return () => clearTimeout(timer);
  }, [auto, hint]);

  return (
    <>
      <button
        type="button"
        onClick={() => { setShowHint(Boolean(hint)); window.print(); }}
        className={`${className} no-print`}
        data-print-hide
      >
        <IconPrint className="h-4 w-4" /> {label}
      </button>
      {showHint && hint ? (
        <p data-print-hide className="alert-info mt-2 w-full text-[14px]">{hint}</p>
      ) : null}
    </>
  );
}
