// Single source of truth for the four tag colours plus screen-free, matching
// the real hex values used in the Android and Windows apps (see zen-claims.md).
// Every section that draws a tag swatch, chip or timeline bar imports this
// instead of hard-coding a hex value or a Tailwind colour utility.

export type ZenTagId = "learn" | "productive" | "fun" | "waste";

export interface ZenTag {
  id: ZenTagId;
  label: string;
  hex: string;
  examples: string[];
}

export const ZEN_TAGS: ZenTag[] = [
  {
    id: "learn",
    label: "Learn",
    hex: "var(--zen-learn)",
    examples: ["Educational videos", "Docs & research sites", "Courses"],
  },
  {
    id: "productive",
    label: "Productive",
    hex: "var(--zen-productive)",
    examples: ["Work apps", "Notes & tasks", "Terminal / IDE"],
  },
  {
    id: "fun",
    label: "Fun",
    hex: "var(--zen-fun)",
    examples: ["Messaging", "Music", "Regular browsing"],
  },
  {
    id: "waste",
    label: "Waste",
    hex: "var(--zen-waste)",
    examples: ["YouTube Shorts", "Anything you tag \"waste\""],
  },
];

export const ZEN_TAG_INK: Record<ZenTagId, string> = {
  learn: "var(--zen-learn-ink)",
  productive: "var(--zen-productive-ink)",
  fun: "var(--zen-fun-ink)",
  waste: "var(--zen-waste-ink)",
};
