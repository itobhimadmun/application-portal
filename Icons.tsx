import type { SVGProps } from "react";

type P = SVGProps<SVGSVGElement>;
const base = (props: P) => ({
  width: 20, height: 20, viewBox: "0 0 24 24", fill: "none",
  stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const, "aria-hidden": true, ...props,
});

export const IconSearch = (p: P) => (<svg {...base(p)}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>);
export const IconDoc = (p: P) => (<svg {...base(p)}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></svg>);
export const IconDownload = (p: P) => (<svg {...base(p)}><path d="M12 4v11" /><path d="m7.5 10.5 4.5 4.5 4.5-4.5" /><path d="M5 19h14" /></svg>);
export const IconPrint = (p: P) => (<svg {...base(p)}><path d="M7 9V4h10v5" /><rect x="4" y="9" width="16" height="7" rx="1.5" /><path d="M7 14h10v6H7z" /></svg>);
export const IconCheck = (p: P) => (<svg {...base(p)}><path d="m5 12.5 4.5 4.5L19 7" /></svg>);
export const IconChevron = (p: P) => (<svg {...base(p)}><path d="m9 5 7 7-7 7" /></svg>);
export const IconMenu = (p: P) => (<svg {...base(p)}><path d="M4 7h16M4 12h16M4 17h16" /></svg>);
export const IconClose = (p: P) => (<svg {...base(p)}><path d="M6 6l12 12M18 6 6 18" /></svg>);
export const IconBuilding = (p: P) => (<svg {...base(p)}><path d="M4 20h16" /><path d="M6 20V7l6-3 6 3v13" /><path d="M10 12h4M10 16h4" /></svg>);
export const IconStamp = (p: P) => (<svg {...base(p)}><path d="M9 4h6v5l2 3H7l2-3z" /><rect x="5" y="15" width="14" height="4" rx="1" /></svg>);
export const IconUser = (p: P) => (<svg {...base(p)}><circle cx="12" cy="8" r="3.5" /><path d="M5 20a7 7 0 0 1 14 0" /></svg>);
export const IconMap = (p: P) => (<svg {...base(p)}><path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" /><path d="M9 4v14M15 6v14" /></svg>);
export const IconCash = (p: P) => (<svg {...base(p)}><rect x="3" y="7" width="18" height="10" rx="2" /><circle cx="12" cy="12" r="2.5" /></svg>);
export const IconBook = (p: P) => (<svg {...base(p)}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H19v15H6.5A2.5 2.5 0 0 0 4 20.5z" /></svg>);
export const IconHeart = (p: P) => (<svg {...base(p)}><path d="M12 20s-7-4.4-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7 2.8C19 15.6 12 20 12 20z" /></svg>);
export const IconTools = (p: P) => (<svg {...base(p)}><path d="M15 4a4 4 0 0 0-3.4 6.1L4 17.7 6.3 20l7.6-7.6A4 4 0 1 0 15 4z" /></svg>);
export const IconClock = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3 2" /></svg>);
export const IconAlert = (p: P) => (<svg {...base(p)}><path d="M12 4 2.5 20h19z" /><path d="M12 10v4M12 17.2h.01" /></svg>);
export const IconEdit = (p: P) => (<svg {...base(p)}><path d="M4 20h4l10-10-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></svg>);
export const IconPlus = (p: P) => (<svg {...base(p)}><path d="M12 5v14M5 12h14" /></svg>);
export const IconTrash = (p: P) => (<svg {...base(p)}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13" /></svg>);
export const IconEye = (p: P) => (<svg {...base(p)}><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></svg>);
export const IconGrid = (p: P) => (<svg {...base(p)}><rect x="4" y="4" width="7" height="7" rx="1" /><rect x="13" y="4" width="7" height="7" rx="1" /><rect x="4" y="13" width="7" height="7" rx="1" /><rect x="13" y="13" width="7" height="7" rx="1" /></svg>);
export const IconSettings = (p: P) => (<svg {...base(p)}><circle cx="12" cy="12" r="3" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" /></svg>);

export const CATEGORY_ICONS: Record<string, (p: P) => React.ReactElement> = {
  doc: IconDoc,
  stamp: IconStamp,
  user: IconUser,
  building: IconBuilding,
  map: IconMap,
  cash: IconCash,
  book: IconBook,
  heart: IconHeart,
  tools: IconTools,
  grid: IconGrid,
};
