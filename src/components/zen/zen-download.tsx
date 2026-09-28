"use client";

import { useState, useSyncExternalStore } from "react";
import { AlertTriangle, Download, ShieldQuestion, Trash2 } from "lucide-react";
import {
  formatAssetSize,
  formatReleaseDate,
  ZEN_ANDROID_APK_URL,
  ZEN_WINDOWS_INSTALLER_URL,
  ZEN_SHA256SUMS_URL,
  ZEN_ALL_RELEASES_URL,
  type ZenRelease,
} from "@/lib/zen-release";
import { ZenCopyButton } from "./zen-copy-button";
import { ZenSection } from "./zen-section";

type Platform = "android" | "windows";

// Same two-pass pattern as ZenDownloadButtons: server and first client render
// both use "android" as the default tab (stable, no hydration mismatch), then
// this swaps to "windows" right after hydration if the visitor is on
// Windows. Unknown/unsupported platforms keep the default — both tabs stay
// one click away either way.
function subscribe() {
  return () => {};
}
function getSnapshot(): Platform {
  const ua = navigator.userAgent || "";
  return /windows/i.test(ua) ? "windows" : "android";
}
function getServerSnapshot(): Platform {
  return "android";
}

export function ZenDownload({ release }: { release: ZenRelease }) {
  const detected = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [tab, setTab] = useState<Platform | null>(null);
  const active = tab ?? detected;

  const androidSize = formatAssetSize(release.android.sizeBytes);
  const windowsSize = formatAssetSize(release.windows.sizeBytes);
  const publishedDate = formatReleaseDate(release.publishedAt);

  return (
    <ZenSection
      id="download"
      eyebrow="Get Zen"
      title="Download & install"
      lede="Direct downloads, always the latest release. No store, no account, no catch."
      headerRight={
        (release.version || publishedDate) && (
          <p className="font-mono text-xs text-muted-foreground">
            {release.version && <span>{release.version}</span>}
            {release.version && publishedDate && <span> · </span>}
            {publishedDate && <span>Released {publishedDate}</span>}
          </p>
        )
      }
    >
      <div className="flex items-start gap-3 rounded-xl border border-border bg-card p-4">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--zen-fun-ink)]" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Personal project, in beta, provided as is.</span>{" "}
          Not on the Play Store or the Microsoft Store, and neither installer is code-signed — see
          below for what that means during install.
        </p>
      </div>

      {/* Tabs */}
      <div className="mt-8" role="tablist" aria-label="Choose your platform">
        <div className="inline-flex rounded-xl border border-border bg-card p-1">
          {(["android", "windows"] as const).map((p) => (
            <button
              key={p}
              type="button"
              role="tab"
              aria-selected={active === p}
              onClick={() => setTab(p)}
              className={`rounded-lg px-5 py-2 font-sans text-sm font-medium transition-all ${
                active === p ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {p === "android" ? "Android" : "Windows"}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-border bg-card p-6 sm:p-8">
          {active === "android" ? (
            <PlatformPanel
              href={ZEN_ANDROID_APK_URL}
              fileLabel="Zen.apk"
              sizeLabel={androidSize}
              requirement="Requires Android 8.0 (Oreo) or newer, 64-bit."
              steps={[
                "Download Zen.apk and open it. If prompted, allow your browser to install unknown apps.",
                "Google Play Protect may warn about an unknown developer — expected for an app installed outside the Play Store. Choose Install anyway.",
                "Open Zen and grant permissions from Settings. On Android 13+, Accessibility and Usage access can show as a greyed-out \"restricted setting\" — tap Zen in Accessibility once, dismiss the popup, then go to App info → ⋮ → Allow restricted settings, then turn it on.",
              ]}
              uninstall="Long-press the Zen icon and choose Uninstall — if Zen is your home screen, switch back to another launcher first in Settings → Apps → Default apps → Home app."
            />
          ) : (
            <PlatformPanel
              href={ZEN_WINDOWS_INSTALLER_URL}
              fileLabel="ZenDesktopSetup.exe"
              sizeLabel={windowsSize}
              requirement="Requires Windows 10 (1809+) or Windows 11, 64-bit."
              steps={[
                "Download and run ZenDesktopSetup.exe.",
                "SmartScreen will likely show \"Windows protected your PC\" because the installer isn't code-signed. Click More info → Run anyway.",
                "No admin rights needed. A setup wizard walks you through the browser extension and everything else in one pass.",
              ]}
              uninstall="Settings → Apps, find Zen Desktop, and uninstall — or use the “Uninstall Zen Desktop” shortcut in the Start menu. You'll be asked whether to also delete your local data."
            />
          )}
        </div>
      </div>

      {(release.android.sha256 || release.windows.sha256) && (
        <details className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 p-5 text-white">
          <summary className="cursor-pointer font-mono text-[11px] uppercase tracking-wider text-neutral-400">
            SHA-256 checksums
          </summary>
          <div className="mt-4 flex flex-col gap-2.5">
            {release.android.sha256 && (
              <ChecksumRow label="Zen.apk" value={release.android.sha256} />
            )}
            {release.windows.sha256 && (
              <ChecksumRow label="Setup.exe" value={release.windows.sha256} />
            )}
          </div>
          <a
            href={ZEN_SHA256SUMS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-block font-mono text-[11px] text-neutral-500 underline decoration-dotted hover:text-neutral-300"
          >
            View SHA256SUMS.txt
          </a>
        </details>
      )}

      <div className="mt-6 flex items-start gap-2.5 text-xs text-muted-foreground">
        <ShieldQuestion className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Both downloads come from GitHub Releases on the public{" "}
          <a
            href={ZEN_ALL_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[color:var(--accent-strong)] underline decoration-dotted hover:decoration-solid"
          >
            zen-releases
          </a>{" "}
          repository, which always points at the newest build.
        </p>
      </div>
    </ZenSection>
  );
}

function PlatformPanel({
  href,
  fileLabel,
  sizeLabel,
  requirement,
  steps,
  uninstall,
}: {
  href: string;
  fileLabel: string;
  sizeLabel: string | null;
  requirement: string;
  steps: string[];
  uninstall: string;
}) {
  return (
    <div>
      <a
        href={href}
        rel="noopener noreferrer"
        className="flex items-center gap-3 rounded-xl border border-foreground bg-foreground px-5 py-4 text-background transition-opacity hover:opacity-90"
      >
        <Download className="h-5 w-5 shrink-0" />
        <span className="flex flex-col">
          <span className="text-sm font-semibold">Download {fileLabel}</span>
          {sizeLabel && <span className="font-mono text-[11px] opacity-80">{sizeLabel}</span>}
        </span>
      </a>
      <ol className="mt-6 flex flex-col gap-3 text-sm text-foreground">
        {steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-secondary font-mono text-[10px] font-bold">
              {i + 1}
            </span>
            <span className="leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-5 font-mono text-[11px] text-muted-foreground">{requirement}</p>
      <details className="mt-5 border-t border-border pt-4">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-sans text-xs font-semibold text-foreground">
          <Trash2 className="h-3.5 w-3.5 text-muted-foreground" /> Uninstalling
        </summary>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{uninstall}</p>
      </details>
    </div>
  );
}

function ChecksumRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <span className="w-20 shrink-0 font-mono text-[11px] text-neutral-400">{label}</span>
      <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-[color:var(--zen-learn)]">
        {value}
      </code>
      <ZenCopyButton value={value} label={label} />
    </div>
  );
}
