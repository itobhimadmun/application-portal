"use client";

import { useState } from "react";

/**
 * Two-step destructive action. Avoids native confirm() dialogs while still
 * making it impossible to delete a document with a single stray click.
 */
export default function ConfirmButton({
  action, label, confirmLabel, cancelLabel, className = "btn-danger btn-sm",
}: {
  action: (formData: FormData) => void | Promise<void>;
  label: string;
  confirmLabel: string;
  cancelLabel: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);

  if (!armed) {
    return (
      <button type="button" className={className} onClick={() => setArmed(true)}>
        {label}
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <form action={action}>
        <button type="submit" className="btn-crimson btn-sm">{confirmLabel}</button>
      </form>
      <button type="button" className="btn-outline btn-sm" onClick={() => setArmed(false)}>
        {cancelLabel}
      </button>
    </span>
  );
}
