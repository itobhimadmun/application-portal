import { IconSearch } from "./Icons";

export default function EmptyState({
  title, description, children,
}: { title: string; description?: string; children?: React.ReactNode }) {
  return (
    <div className="gov-card flex flex-col items-center px-6 py-12 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-surface-50 text-ink-400">
        <IconSearch className="h-6 w-6" />
      </span>
      <p className="text-[18px] font-bold text-ink-900">{title}</p>
      {description ? <p className="mt-1 max-w-md text-[15px] text-ink-500">{description}</p> : null}
      {children ? <div className="mt-4">{children}</div> : null}
    </div>
  );
}
