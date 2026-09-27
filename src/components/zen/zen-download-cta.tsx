"use client";

import { useSyncExternalStore } from "react";
import { Download, Monitor } from "lucide-react";

type Platform = "android" | "windows" | "unsupported" | "unknown";

// The visitor's platform is an external (browser) value, not something that
// changes during the page's life — so this reads it via useSyncExternalStore
// rather than useEffect+setState. React uses `getServerSnapshot` ("unknown")
// for the server-rendered HTML and the first client render, then swaps in the
// real value from `getSnapshot` right after hydration, which is exactly the
// two-pass behaviour "server-render both buttons, then highlight on the
// client" needs — and it sidesteps the extra render an effect would cause.
function subscribe() {
  // Nothing to subscribe to: the platform can't change after page load.
  return () => {};
}

function getSnapshot(): Platform {
  const ua = navigator.userAgent || "";
  if (/android/i.test(ua)) return "android";
  if (/windows/i.test(ua)) return "windows";
  if (/iphone|ipad|ipod|macintosh|mac os x/i.test(ua)) return "unsupported";
  return "unknown";
}

function getServerSnapshot(): Platform {
  return "unknown";
}

interface ZenDownloadButtonsProps {
  androidHref: string;
  androidSublabel?: string;
  windowsHref: string;
  windowsSublabel?: string;
  /** "compact" for the hero, "full" for the download section. */
  size?: "compact" | "full";
}

/**
 * Both buttons are always in the DOM, server-rendered and fully functional
 * without JS (no-JS or crawler visitors still get two working download
 * links). Once mounted client-side, this only adds a highlight to the
 * button that matches the visitor's OS, and a note for platforms Zen
 * doesn't support yet — it never hides a button.
 */
export function ZenDownloadButtons({
  androidHref,
  androidSublabel,
  windowsHref,
  windowsSublabel,
  size = "full",
}: ZenDownloadButtonsProps) {
  const platform = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const isCompact = size === "compact";
  const baseBtn = isCompact
    ? "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 font-sans text-sm font-medium transition-all"
    : "flex flex-1 items-center gap-3 rounded-xl border px-5 py-4 text-left transition-all";

  function highlightClass(matches: boolean) {
    if (isCompact) {
      return matches
        ? "border border-foreground bg-foreground text-background hover:opacity-90"
        : "border border-border bg-card text-foreground hover:border-foreground/40 hover:bg-secondary/60";
    }
    return matches
      ? "border-foreground bg-foreground text-background shadow-sm"
      : "border-border bg-card text-foreground hover:border-foreground/40";
  }

  return (
    <div className="flex flex-col gap-3">
      <div className={`flex flex-wrap items-stretch gap-3 ${isCompact ? "" : "sm:flex-nowrap"}`}>
        <a
          href={androidHref}
          rel="noopener noreferrer"
          aria-label={`Download Zen for Android${androidSublabel ? `, ${androidSublabel}` : ""}`}
          className={`${baseBtn} ${highlightClass(platform === "android")}`}
        >
          <Download className={isCompact ? "h-4 w-4" : "h-5 w-5 shrink-0"} aria-hidden="true" />
          <span className="flex flex-col">
            <span className={isCompact ? "text-sm font-medium" : "text-sm font-semibold"}>
              Download for Android
            </span>
            {androidSublabel && !isCompact && (
              <span className="font-mono text-[11px] opacity-70">{androidSublabel}</span>
            )}
          </span>
        </a>

        <a
          href={windowsHref}
          rel="noopener noreferrer"
          aria-label={`Download Zen for Windows${windowsSublabel ? `, ${windowsSublabel}` : ""}`}
          className={`${baseBtn} ${highlightClass(platform === "windows")}`}
        >
          <Monitor className={isCompact ? "h-4 w-4" : "h-5 w-5 shrink-0"} aria-hidden="true" />
          <span className="flex flex-col">
            <span className={isCompact ? "text-sm font-medium" : "text-sm font-semibold"}>
              Download for Windows
            </span>
            {windowsSublabel && !isCompact && (
              <span className="font-mono text-[11px] opacity-70">{windowsSublabel}</span>
            )}
          </span>
        </a>
      </div>

      {platform === "unsupported" && (
        <p className="font-mono text-xs text-muted-foreground">
          Zen isn&apos;t available for your platform yet — it currently supports Android and
          Windows only.
        </p>
      )}
    </div>
  );
}
