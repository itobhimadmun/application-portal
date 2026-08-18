"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { IconSearch } from "./ui/Icons";
import type { Locale } from "@/lib/i18n";

type Suggestion = {
  slug: string; title_ne: string; title_en: string;
  section_ne: string | null; section_en: string | null;
};

export default function SearchBox({
  locale, defaultValue = "", placeholder, buttonLabel, size = "lg",
}: {
  locale: Locale; defaultValue?: string; placeholder: string;
  buttonLabel: string; size?: "lg" | "sm";
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value.trim().length < 2) { setItems([]); return; }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/suggest?q=${encodeURIComponent(value)}`, { signal: controller.signal });
        const data = await res.json();
        setItems(data.items ?? []);
        setOpen(true);
      } catch { /* aborted */ }
    }, 200);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [value]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function submit(term: string) {
    setOpen(false);
    router.push(`/services?q=${encodeURIComponent(term.trim())}`);
  }

  const inputClasses =
    size === "lg"
      ? "w-full rounded-[6px] border-2 border-royal-600 bg-white py-3.5 pl-11 pr-3 text-[17px] text-ink-900 placeholder:text-ink-400 sm:text-[18px]"
      : "gov-input pl-10";

  return (
    <div ref={boxRef} className="relative">
      <form
        role="search"
        onSubmit={(e) => { e.preventDefault(); submit(value); }}
        className="flex flex-col gap-2 sm:flex-row"
      >
        <div className="relative flex-1">
          <IconSearch className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-500" />
          <input
            type="search"
            name="q"
            value={value}
            onChange={(e) => { setValue(e.target.value); setActive(-1); }}
            onFocus={() => items.length && setOpen(true)}
            onKeyDown={(e) => {
              if (!open || !items.length) return;
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, items.length - 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, -1)); }
              if (e.key === "Enter" && active >= 0) { e.preventDefault(); router.push(`/services/${items[active].slug}`); }
              if (e.key === "Escape") setOpen(false);
            }}
            placeholder={placeholder}
            aria-label={placeholder}
            aria-autocomplete="list"
            aria-expanded={open}
            className={inputClasses}
          />
        </div>
        <button type="submit" className={size === "lg" ? "btn-crimson sm:px-8 sm:text-[17px]" : "btn-primary btn-sm"}>
          {buttonLabel}
        </button>
      </form>

      {open && items.length > 0 ? (
        <ul
          role="listbox"
          className="absolute z-30 mt-1 w-full overflow-hidden rounded-[6px] border border-line-200 bg-white text-left shadow-lg"
        >
          {items.map((item, i) => (
            <li key={item.slug} role="option" aria-selected={i === active}>
              <a
                href={`/services/${item.slug}`}
                className={`block border-b border-line-100 px-4 py-2.5 last:border-0 ${i === active ? "bg-royal-50" : "hover:bg-surface-50"}`}
              >
                <span className="block text-[15px] font-semibold text-ink-900">
                  {locale === "en" ? item.title_en || item.title_ne : item.title_ne}
                </span>
                <span className="block text-[13px] text-ink-500">
                  {locale === "en" ? item.section_en || item.section_ne : item.section_ne}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
