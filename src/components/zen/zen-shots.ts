// Typed manifest for the cross-platform screenshot gallery (ZenShotsGallery).
//
// Filenames below are the AGREED, planned names for screenshots the owner
// will drop in later — see PRODUCT_PAGE_EXECUTION.md. Most don't exist yet.
// The gallery component checks each `src` against the filesystem at build
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
  // --- Windows -------------------------------------------------------------
  {
    src: "/zen/windows/dashboard.png",
    alt: "Zen Desktop dashboard showing today's tracked activity by category",
    caption: "Dashboard — today's Learn / Productive / Fun / Waste split",
    platform: "windows",
  },
  {
    src: "/zen/windows/timeline.png",
    alt: "Zen Desktop timeline with one lane per monitor plus Attention and Phone lanes",
    caption: "Per-display timeline lanes, plus Attention and Phone",
    platform: "windows",
  },
  {
    src: "/zen/windows/all-devices.png",
    alt: "Zen All Devices view merging phone and PC activity into one day",
    caption: "All Devices — phone and PC merged into one day",
    platform: "windows",
  },
  {
    src: "/zen/windows/tags.png",
    alt: "Zen Desktop tag picker for classifying an app or site as Learn, Productive, Fun, or Waste",
    caption: "Tagging an app: Learn, Productive, Fun, or Waste",
    platform: "windows",
  },
  {
    src: "/zen/windows/widget.png",
    alt: "Zen Desktop floating widget showing live tracking state on the desktop",
    caption: "The floating widget, always visible on the desktop",
    platform: "windows",
  },
  {
    src: "/zen/windows/setup-ai.png",
    alt: "Zen Desktop setup wizard screen for choosing the on-device AI tagging model",
    caption: "Setup wizard — choosing built-in AI or Ollama",
    platform: "windows",
  },
  {
    src: "/zen/windows/setup-colours.png",
    alt: "Zen Desktop setup wizard screen for customising category colours",
    caption: "Setup wizard — customising category colours",
    platform: "windows",
  },
  // --- Android ---------------------------------------------------------------
  {
    src: "/zen/android/home.png",
    alt: "Zen Android home screen in launcher mode with the age meter and clock",
    caption: "Home screen, set as the default launcher",
    platform: "android",
  },
  {
    src: "/zen/android/drawer.png",
    alt: "Zen Android alphabetical app drawer",
    caption: "The alphabetical app drawer",
    platform: "android",
  },
  {
    src: "/zen/android/app-mode.png",
    alt: "Zen running in app mode alongside the phone's regular home screen",
    caption: "App mode — tracking only, next to your usual launcher",
    platform: "android",
  },
  {
    src: "/zen/android/focus.png",
    alt: "Zen Android unbypassable app block screen",
    caption: "An unbypassable focus block in progress",
    platform: "android",
  },
  {
    src: "/zen/android/screen-free.png",
    alt: "Zen Android screen-free break reward shown on unlock",
    caption: "A screen-free break, recorded on unlock",
    platform: "android",
  },
];
