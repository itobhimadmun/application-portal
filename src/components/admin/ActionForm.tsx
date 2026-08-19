"use client";

import { useActionState } from "react";
import type { ActionState } from "@/lib/actions";

/** Small reusable wrapper that renders a server action's success/error state. */
export default function ActionForm({
  action, submitLabel, children, className = "space-y-3",
}: {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction, pending] = useActionState<ActionState, FormData>(action, {});

  return (
    <form action={formAction} className={className}>
      {state.error ? <p className="alert-danger" role="alert">{state.error}</p> : null}
      {state.ok ? <p className="alert-success" role="status">{state.message}</p> : null}
      {children}
      <button type="submit" disabled={pending} className="btn-primary">
        {pending ? "…" : submitLabel}
      </button>
    </form>
  );
}
