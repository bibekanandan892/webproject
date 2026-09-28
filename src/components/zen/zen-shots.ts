// Typed manifest for the 15 real Zen screenshots (Windows demo-data build,
// Android emulator) plus their pre-generated WebP 1x/2x renditions
// (see scripts/gen_zen_images.py output, baked into zen-shot-manifest.json
// by that script — regenerate it if a screenshot is replaced).
//
// Windows shots come from the real app running on demo data (no personal
// activity); Android shots come from an emulator.

import manifest from "./zen-shot-manifest.json";

export type ZenShotPlatform = "android" | "windows";

export interface ZenShot {
  /** Path under public/, e.g. "windows/dashboard.png" (key into the manifest). */
  src: string;
  alt: string;
  caption: string;
  platform: ZenShotPlatform;
}

export const ZEN_SHOTS: ZenShot[] = [
  {
    src: "windows/dashboard.png",
    alt: "Zen Desktop dashboard: age meter, today's usage by state, per-display timeline and top apps",
    caption: "The dashboard: a whole day of attention, colour-coded by tag",
    platform: "windows",
  },
  {
    src: "windows/timeline.png",
    alt: "Zen Desktop timeline with an Attention lane and one lane per display, including a disconnected display",
    caption: "One lane per display, plus a merged Attention lane",
    platform: "windows",
  },
  {
    src: "windows/all-devices.png",
    alt: "Zen All Devices view with Learn, Productive, Fun, Waste and screen-free totals across phone and PC",
    caption: "All Devices: phone and PC merged into one day",
    platform: "windows",
  },
  {
    src: "windows/tags.png",
    alt: "Zen Desktop Tags and Rules tab with apps tagged Learn, Productive, Fun or Waste",
    caption: "Tags & Rules: one click to tag an app, and your tag always wins",
    platform: "windows",
  },
  {
    src: "windows/widget.png",
    alt: "Zen Desktop floating widget showing the age meter and today's tag totals",
    caption: "The floating widget: today at a glance, always on screen",
    platform: "windows",
  },
  {
    src: "windows/setup-welcome.png",
    alt: "Zen Desktop setup wizard welcome step",
    caption: "First-run setup wizard",
    platform: "windows",
  },
  {
    src: "windows/setup-colours.png",
    alt: "Zen Desktop setup wizard step explaining the Learn, Productive, Fun, Waste and screen-free colours",
    caption: "Setup explains what every colour means",
    platform: "windows",
  },
  {
    src: "windows/setup-timeline.png",
    alt: "Zen Desktop setup wizard step explaining how to read the timeline",
    caption: "…and how to read the timeline",
    platform: "windows",
  },
  {
    src: "windows/setup-ai.png",
    alt: "Zen Desktop setup wizard AI tagging step detecting Ollama and offering the built-in model",
    caption: "AI tagging: detects Ollama, or downloads a small on-device model",
    platform: "windows",
  },
  {
    src: "android/home.png",
    alt: "Zen Android home screen in launcher mode with clock, age meter and pinned apps",
    caption: "Launcher mode: a calm home screen with only the apps you pinned",
    platform: "android",
  },
  {
    src: "android/drawer.png",
    alt: "Zen Android alphabetical app list with search and quick letter index",
    caption: "The app list is one swipe away — text only, no icons to tempt you",
    platform: "android",
  },
  {
    src: "android/focus.png",
    alt: "Zen Android long-press menu with wait timer, block, time reminder, tags and grayscale options",
    caption: "Long-press any app: wait timer, block, reminder, grayscale, tag",
    platform: "android",
  },
  {
    src: "android/app-mode.png",
    alt: "Zen Android in app mode showing the clock and age meter",
    caption: "App mode: keep your launcher, still get the age meter and tracking",
    platform: "android",
  },
  {
    src: "android/screen-time.png",
    alt: "Zen Android screen time settings with productive time, tagging and the last seven days",
    caption: "Screen time by tag, with the last seven days",
    platform: "android",
  },
  {
    src: "android/screen-free.png",
    alt: "Zen Android screen-free reward after a two hour break",
    caption: "Time away from the phone is rewarded when you come back",
    platform: "android",
  },
];

interface ManifestEntry {
  png: string;
  webp1x: string;
  webp2x: string;
  width: number;
  height: number;
}

const SHOT_MANIFEST = manifest as Record<string, ManifestEntry>;

export function zenShotAsset(src: string): ManifestEntry {
  const entry = SHOT_MANIFEST[src];
  if (!entry) {
    throw new Error(`zen-shots: no generated asset for "${src}" — run scripts/gen_zen_images.py`);
  }
  return entry;
}

export function zenShotBySrc(src: string): ZenShot {
  const shot = ZEN_SHOTS.find((s) => s.src === src);
  if (!shot) throw new Error(`zen-shots: unknown shot "${src}"`);
  return shot;
}
