import type { SVGProps } from "react";

const base = (p: SVGProps<SVGSVGElement>) => ({
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  ...p,
});

export const IconBag = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 8h12l-1 12H7L6 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </svg>
);
const HEART_PATH =
  "M12 20.7C12 20.7 3.75 14.1 3.75 8.7C3.75 5.95 5.85 3.9 8.4 3.9C10.1 3.9 11.4 4.85 12 6.05C12.6 4.85 13.9 3.9 15.6 3.9C18.15 3.9 20.25 5.95 20.25 8.7C20.25 14.1 12 20.7 12 20.7Z";
export const IconHeart = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d={HEART_PATH} />
  </svg>
);
export const IconHeartFill = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ ...p, fill: "currentColor", stroke: "none" })}>
    <path d={HEART_PATH} />
  </svg>
);
export const IconSearch = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.2-3.2" />
  </svg>
);
export const IconClose = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
);
export const IconMenu = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
);
export const IconMinus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 12h14" />
  </svg>
);
export const IconPlus = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);
export const IconCheck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="m5 12 4 4L19 6" />
  </svg>
);
export const IconArrow = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);
export const IconTruck = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" />
    <circle cx="7" cy="17" r="1.6" />
    <circle cx="17.5" cy="17" r="1.6" />
  </svg>
);
export const IconDrop = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3s6 6.4 6 10a6 6 0 0 1-12 0c0-3.6 6-10 6-10Z" />
  </svg>
);
export const IconGift = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M4 11h16v9H4zM4 8h16v3H4zM12 8v12M12 8S9 8 9 5.5 12 8 12 8Zm0 0s3 0 3-2.5S12 8 12 8Z" />
  </svg>
);
export const IconSparkle = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M12 3l1.6 5.4L19 10l-5.4 1.6L12 17l-1.6-5.4L5 10l5.4-1.6z" />
  </svg>
);
export const IconBell = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
    <path d="M10.5 20a1.8 1.8 0 0 0 3 0" />
  </svg>
);
export const IconInstagram = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base(p)}>
    <rect x="4" y="4" width="16" height="16" rx="4.5" />
    <circle cx="12" cy="12" r="3.4" />
    <circle cx="17" cy="7" r="0.6" fill="currentColor" />
  </svg>
);
export const IconTiktok = (p: SVGProps<SVGSVGElement>) => (
  <svg {...base({ ...p, fill: "currentColor", stroke: "none" })}>
    <path d="M16.5 3c.3 2.1 1.5 3.5 3.5 3.7v2.4c-1.2.1-2.4-.2-3.5-.9v5.9c0 3.3-2.4 5.6-5.5 5.6-3 0-5.3-2.2-5.3-5.1 0-3 2.4-5.2 5.6-4.9v2.5c-.4-.1-.9-.2-1.3-.1-1.3.1-2.2 1.1-2.1 2.5.1 1.3 1.1 2.2 2.4 2.1 1.4-.1 2.2-1.1 2.2-2.6V3h1.5Z" />
  </svg>
);
