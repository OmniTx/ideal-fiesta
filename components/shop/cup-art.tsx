import React from "react";

export type CupType = "mug" | "demitasse" | "glass" | "shake" | "plate";

const DEMI_ITEMS = [
  "Short macchiato",
  "Long macchiato",
  "Espresso",
  "Doppio",
  "Piccolo",
  "Affogato",
  "Babycino",
];

const CATEGORY_ART: Record<string, CupType> = {
  hot_coffee: "mug",
  iced_coffee: "glass",
  hot_drinks: "mug",
  tea: "mug",
  sweet_tooth: "glass",
  shakes_frappes: "shake",
  breakfast: "plate",
  toasties: "plate",
  specials: "plate",
  spreads: "plate",
};

export function getCupType(itemName: string, category: string): CupType {
  if (DEMI_ITEMS.some((d) => itemName.toLowerCase().includes(d.toLowerCase()))) {
    return "demitasse";
  }
  return CATEGORY_ART[category] || "mug";
}

interface CupArtProps {
  type: CupType;
  height?: number | string;
  className?: string;
}

export function CupArt({ type, height, className = "" }: CupArtProps) {
  const style = height ? { height: typeof height === "number" ? `${height}px` : height } : undefined;

  return (
    <svg
      viewBox="0 0 120 120"
      style={style}
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {type === "mug" && (
        <g>
          <path d="M30 40h54l-6 44a10 10 0 0 1-10 9H46a10 10 0 0 1-10-9z" />
          <path d="M84 50c13 0 15 20 1 22" />
          <path d="M34 51h46" />
          <path d="M26 101c12 7 56 7 68 0" />
          <path d="M50 26c-6-5 2-9-2-14M66 26c-6-5 2-9-2-14" opacity=".4" />
        </g>
      )}

      {type === "demitasse" && (
        <g>
          <path d="M40 50h40l-5 34a9 9 0 0 1-9 8H54a9 9 0 0 1-9-8z" />
          <path d="M80 58c10 0 12 16 1 18" />
          <path d="M44 60h32" />
          <path d="M32 99c10 6 46 6 56 0" />
          <path d="M56 32c-5-4 2-8-2-12" opacity=".4" />
        </g>
      )}

      {type === "glass" && (
        <g>
          <path d="M38 26h44l-7 74a8 8 0 0 1-8 7H53a8 8 0 0 1-8-7z" />
          <path d="M41 44h38" />
          <path d="M50 58l10-6 10 6-10 6z" />
          <path d="M52 78l9-5 9 5-9 5z" />
          <path d="M74 12L64 42" />
        </g>
      )}

      {type === "shake" && (
        <g>
          <path d="M40 46h40l-6 56a8 8 0 0 1-8 7H54a8 8 0 0 1-8-7z" />
          <path d="M44 46c1-9 8-13 12-8 2-9 14-10 15 0 7 0 8 8 1 8" />
          <path d="M76 16L68 40" />
          <path d="M44 66h32" opacity=".4" />
        </g>
      )}

      {type === "plate" && (
        <g>
          <path d="M28 46a14 14 0 0 1 14-14c4-7 32-7 36 0a14 14 0 0 1 14 14c0 7-5 12-11 12v28a6 6 0 0 1-6 6H45a6 6 0 0 1-6-6V58c-6 0-11-5-11-12z" />
          <path d="M39 58h42" opacity=".3" />
          <ellipse cx="63" cy="72" rx="17" ry="13" />
          <circle cx="58" cy="70" r="5.5" />
        </g>
      )}
    </svg>
  );
}
