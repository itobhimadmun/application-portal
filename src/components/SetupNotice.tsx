import { IconAlert } from "./ui/Icons";

/** Rendered when the database is unreachable or the schema has not been created. */
export default function SetupNotice({ error }: { error?: string }) {
  return (
    <div className="gov-container py-12">
      <div className="alert-warning">
        <p className="flex items-center gap-2 text-[17px] font-bold">
          <IconAlert /> पोर्टल सेटअप बाँकी छ · Portal setup required
        </p>
        <p className="mt-2 text-[15px]">
          The portal cannot reach its database yet. Set <code className="font-mono">DATABASE_URL</code> and{" "}
          <code className="font-mono">AUTH_SECRET</code>, then run:
        </p>
        <pre className="mt-3 overflow-x-auto rounded bg-white p-3 text-[13px] text-ink-800">
{`npm run db:setup   # creates the schema and the first admin user
npm run db:seed    # loads sample services (optional)`}
        </pre>
        {error ? <p className="mt-3 text-[13px] opacity-80">Details: {error}</p> : null}
      </div>
    </div>
  );
}
