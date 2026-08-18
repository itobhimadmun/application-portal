import Link from "next/link";

export default function Breadcrumb({ items }: { items: { href?: string; label: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="no-print border-b border-line-100 bg-surface-50">
      <ol className="gov-container flex flex-wrap items-center gap-1.5 py-2.5 text-[13.5px] text-ink-500">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1.5">
            {i > 0 ? <span aria-hidden="true">›</span> : null}
            {item.href ? (
              <Link href={item.href} className="hover:text-royal-600 hover:underline">{item.label}</Link>
            ) : (
              <span className="font-semibold text-ink-700" aria-current="page">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
