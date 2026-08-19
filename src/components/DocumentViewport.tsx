"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Fits the application to the width it has been given: shrunk so a phone shows
 * the whole page rather than a horizontally scrolling fragment, and enlarged on
 * a wide screen so the form is comfortably readable — the same fit-to-width a
 * PDF viewer does, and the reason the document can be the hero of the page.
 *
 * The scale is screen-only. Printing resets it and the paper comes out at the
 * size the document actually is.
 */
/** Enlarging past this stops feeling like a document and starts feeling broken. */
const MAX_SCALE = 1.4;
const MIN_SCALE = 0.3;

export default function DocumentViewport({
  pageWidth, children, className = "",
}: {
  /** Page width in points, as read from the document. */
  pageWidth: number;
  children: React.ReactNode;
  className?: string;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const element = frame.current;
    if (!element) return;

    // Points to CSS pixels at the browser's nominal 96dpi.
    const widthPx = (pageWidth / 72) * 96;

    const fit = () => {
      // clientWidth includes padding, which is not space the page can use.
      const style = getComputedStyle(element);
      const available = element.clientWidth
        - parseFloat(style.paddingLeft || "0")
        - parseFloat(style.paddingRight || "0");
      if (available <= 0) return;

      const next = Math.min(MAX_SCALE, Math.max(MIN_SCALE, available / widthPx));
      // Ignore hair-width changes: this observer watches an element whose size
      // can depend on its own content, so reacting to every pixel invites an
      // oscillation between two nearly equal scales.
      setScale((current) => (Math.abs(current - next) < 0.01 ? current : next));
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    return () => observer.disconnect();
  }, [pageWidth]);

  return (
    <div ref={frame} className={`docx-viewport ${className}`}>
      <div style={{ zoom: scale }}>{children}</div>
    </div>
  );
}
