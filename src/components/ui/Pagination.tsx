import Link from "next/link";

export default function Pagination({
  page, perPage, total, buildHref,
}: { page: number; perPage: number; total: number; buildHref: (page: number) => string }) {
  const pages = Math.ceil(total / perPage);
  if (pages <= 1) return null;

  const window: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p++) window.push(p);

  return (
    <nav aria-label="Pagination" className="no-print mt-8 flex flex-wrap items-center justify-center gap-1.5">
      {page > 1 ? (
        <Link href={buildHref(page - 1)} className="btn-outline btn-sm">‹</Link>
      ) : null}
      {window[0] > 1 ? <span className="px-2 text-ink-400">…</span> : null}
      {window.map((p) => (
        <Link
          key={p}
          href={buildHref(p)}
          aria-current={p === page ? "page" : undefined}
          className={p === page ? "btn-primary btn-sm" : "btn-outline btn-sm"}
        >
          {p}
        </Link>
      ))}
      {window[window.length - 1] < pages ? <span className="px-2 text-ink-400">…</span> : null}
      {page < pages ? <Link href={buildHref(page + 1)} className="btn-outline btn-sm">›</Link> : null}
    </nav>
  );
}
