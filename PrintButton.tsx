"use client";

import { IconPrint } from "./ui/Icons";

export default function PrintButton({ label, className = "btn-outline" }: { label: string; className?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className={`${className} no-print`}>
      <IconPrint className="h-4 w-4" /> {label}
    </button>
  );
}
