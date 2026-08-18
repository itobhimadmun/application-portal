"use client";

import { useActionState } from "react";
import { loginAction, type ActionState } from "@/lib/actions";

export default function LoginForm({
  next, locale, labels,
}: {
  next: string;
  locale: "ne" | "en";
  labels: { email: string; password: string; submit: string };
}) {
  const [state, action, pending] = useActionState<ActionState, FormData>(loginAction, {});
  const L = (ne: string, en: string) => (locale === "en" ? en : ne);
  const stage = state.stage ?? "password";
  const secondFactor = stage === "totp" || stage === "enroll";

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      {state.error ? <p className="alert-danger" role="alert">{state.error}</p> : null}

      {!secondFactor ? (
        <>
          <div>
            <label className="gov-label" htmlFor="email">{labels.email}</label>
            <input id="email" name="email" type="email" autoComplete="username" required className="gov-input" />
          </div>
          <div>
            <label className="gov-label" htmlFor="password">{labels.password}</label>
            <input
              id="password" name="password" type="password"
              autoComplete="current-password" required className="gov-input"
            />
          </div>
        </>
      ) : null}

      {stage === "enroll" ? (
        <div className="rounded-[6px] border border-line-200 bg-surface-50 p-4">
          <p className="text-[15px] font-bold text-ink-900">
            {L("दुई चरणको सुरक्षा सक्रिय गर्नुहोस्", "Set up two-step sign-in")}
          </p>
          <p className="mt-1 text-[13.5px] text-ink-500">
            {L(
              "Google Authenticator वा Microsoft Authenticator मा तलको QR स्क्यान गर्नुहोस्, त्यसपछि देखिएको ६ अंकको कोड हाल्नुहोस्। यो एकपटक मात्र गर्नुपर्छ।",
              "Scan this QR code with Google Authenticator or Microsoft Authenticator, then enter the 6-digit code it shows. You only do this once."
            )}
          </p>
          {state.qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={state.qr} alt={L("QR कोड", "QR code")} width={220} height={220} className="mt-3 rounded bg-white p-2" />
          ) : null}
          {state.secretText ? (
            <p className="mt-2 text-[13px] text-ink-500">
              {L("स्क्यान गर्न नसके यो कुञ्जी हाल्नुहोस्:", "Can't scan? Enter this key instead:")}
              <br />
              <code className="font-mono text-[13.5px] tracking-wider text-ink-800">{state.secretText}</code>
            </p>
          ) : null}
        </div>
      ) : null}

      {secondFactor ? (
        <div>
          <label className="gov-label" htmlFor="code">
            {L("प्रमाणीकरण कोड (६ अंक)", "Authentication code (6 digits)")}
          </label>
          <input
            id="code" name="code" inputMode="numeric" autoComplete="one-time-code"
            pattern="[0-9]{6}" maxLength={6} required autoFocus
            className="gov-input text-center text-[22px] tracking-[0.4em]"
            placeholder="000000"
          />
          <span className="gov-hint">
            {L("कोड हरेक ३० सेकेन्डमा बदलिन्छ।", "The code changes every 30 seconds.")}
          </span>
        </div>
      ) : null}

      <button type="submit" disabled={pending} className="btn-primary w-full">
        {pending ? "…" : secondFactor ? L("पुष्टि गर्नुहोस्", "Verify") : labels.submit}
      </button>

      {secondFactor ? (
        <a href="/member-login" className="block text-center text-[13.5px] text-royal-600 hover:underline">
          {L("सुरुबाट सुरु गर्नुहोस्", "Start over")}
        </a>
      ) : null}
    </form>
  );
}
