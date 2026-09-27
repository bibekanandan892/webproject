// Typed manifest for the cross-platform screenshot gallery (ZenShotsGallery).
//
// Windows shots come from the real app running on demo data (no personal
// activity); Android shots come from an emulator. Real-device shots can
// replace them later under the same filenames. The gallery component checks each `src` against the filesystem at build
// time (fs.existsSync) and silently skips any entry whose file is missing,
// so this manifest can be filled in ahead of the actual images without ever
// breaking the build.

export type ZenShotPlatform = "android" | "windows";

export interface ZenShot {
  /** Path under public/, e.g. "/zen/windows/dashboard.png". */
  src: string;
  alt: string;
  caption: string;
  platform: ZenShotPlatform;
}

export const ZEN_SHOTS: ZenShot[] = [
  {
    src: "/zen/windows/dashboard.png",
    alt: "Zen Desktop dashboard: age meter, today's usage by state, per-display timeline and top apps",
    caption: "The dashboard: a whole day of attention, colour-coded by tag",
    platform: "windows",
  },
  {
    src: "/zen/windows/timeline.png",
    alt: "Zen Desktop timeline with an Attention lane and one lane per display, including a disconnected display",
    caption: "One lane per display, plus a merged Attention lane",
    platform: "windows",
  },
  {
    src: "/zen/windows/all-devices.png",
    alt: "Zen All Devices view with Learn, Productive, Fun, Waste and screen-free totals across phone and PC",
    caption: "All Devices: phone and PC merged into one day",
    platform: "windows",
  },
  {
    src: "/zen/windows/tags.png",
    alt: "Zen Desktop Tags and Rules tab with apps tagged Learn, Productive, Fun or Waste",
    caption: "Tags & Rules: one click to tag an app, and your tag always wins",
    platform: "windows",
  },
  {
    src: "/zen/windows/widget.png",
    alt: "Zen Desktop floating widget showing the age meter and today's tag totals",
    caption: "The floating widget: today at a glance, always on screen",
    platform: "windows",
  },
  {
    src: "/zen/windows/setup-welcome.png",
    alt: "Zen Desktop setup wizard welcome step",
    caption: "First-run setup wizard",
    platform: "windows",
  },
  {
    src: "/zen/windows/setup-colours.png",
    alt: "Zen Desktop setup wizard step explaining the Learn, Productive, Fun, Waste and screen-free colours",
    caption: "Setup explains what every colour means",
    platform: "windows",
  },
  {
    src: "/zen/windows/setup-timeline.png",
    alt: "Zen Desktop setup wizard step explaining how to read the timeline",
    caption: "…and how to read the timeline",
    platform: "windows",
  },
  {
    src: "/zen/windows/setup-ai.png",
    alt: "Zen Desktop setup wizard AI tagging step detecting Ollama and offering the built-in model",
    caption: "AI tagging: detects Ollama, or downloads a small on-device model",
    platform: "windows",
  },
  {
    src: "/zen/android/home.png",
    alt: "Zen Android home screen in launcher mode with clock, age meter and three pinned apps",
    caption: "Launcher mode: a calm home screen with only the apps you pinned",
    platform: "android",
  },
  {
    src: "/zen/android/drawer.png",
    alt: "Zen Android alphabetical app list with search and quick letter index",
    caption: "The app list is one swipe away — text only, no icons to tempt you",
    platform: "android",
  },
  {
    src: "/zen/android/focus.png",
    alt: "Zen Android long-press menu with wait timer, block, time reminder, tags and grayscale options",
    caption: "Long-press any app: wait timer, block, reminder, grayscale, tag",
    platform: "android",
  },
  {
    src: "/zen/android/app-mode.png",
    alt: "Zen Android in app mode showing the clock and age meter",
    caption: "App mode: keep your launcher, still get the age meter and tracking",
    platform: "android",
  },
  {
    src: "/zen/android/screen-time.png",
    alt: "Zen Android screen time settings with productive time, tagging and the last seven days",
    caption: "Screen time by tag, with the last seven days",
    platform: "android",
  },
  {
    src: "/zen/android/screen-free.png",
    alt: "Zen Android screen-free reward after a two hour break",
    caption: "Time away from the phone is rewarded when you come back",
    platform: "android",
  },
];
