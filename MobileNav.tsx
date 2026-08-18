"use client";

import { useState } from "react";
import Link from "next/link";
import { IconMenu, IconClose } from "./ui/Icons";

type Item = { href: string; label: string };

export default function MobileNav({
  items, adminLabel, menuLabel, closeLabel,
}: { items: Item[]; adminLabel: string; menuLabel: string; closeLabel: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls="mobile-nav"
        className="btn-outline btn-sm min-h-[44px] px-3"
      >
        {open ? <IconClose /> : <IconMenu />}
        <span className="sr-only">{open ? closeLabel : menuLabel}</span>
        <span aria-hidden="true" className="text-[14px]">{menuLabel}</span>
      </button>

      {open ? (
        <div
          id="mobile-nav"
          className="absolute left-0 right-0 z-40 mt-3 border-y border-line-200 bg-white shadow-sm"
        >
          <ul className="gov-container divide-y divide-line-100 py-1">
            {items.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="block py-3.5 text-[16px] font-semibold text-ink-800"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/admin/login"
                onClick={() => setOpen(false)}
                className="block py-3.5 text-[16px] font-semibold text-royal-600"
              >
                {adminLabel}
              </Link>
            </li>
          </ul>
        </div>
      ) : null}
    </div>
  );
}
