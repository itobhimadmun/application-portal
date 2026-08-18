"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/lib/actions";

export default function LoginForm({
  next, labels,
}: { next: string; labels: { email: string; password: string; submit: string } }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(loginAction, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      {state.error ? <p className="alert-danger" role="alert">{state.error}</p> : null}

      <div>
        <label className="gov-label" htmlFor="email">{labels.email}</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="gov-input" />
      </div>
      <div>
        <label className="gov-label" htmlFor="password">{labels.password}</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="gov-input" />
      </div>
      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "…" : labels.submit}
      </button>
    </form>
  );
}
