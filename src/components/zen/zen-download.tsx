import { AlertTriangle, ShieldQuestion, Trash2 } from "lucide-react";
import {
  formatAssetSize,
  formatReleaseDate,
  ZEN_ANDROID_APK_URL,
  ZEN_WINDOWS_INSTALLER_URL,
  ZEN_SHA256SUMS_URL,
  ZEN_ALL_RELEASES_URL,
  type ZenRelease,
} from "@/lib/zen-release";
import { ZenDownloadButtons } from "./zen-download-cta";
import { ZenCopyButton } from "./zen-copy-button";

export function ZenDownload({ release }: { release: ZenRelease }) {
  const androidSize = formatAssetSize(release.android.sizeBytes);
  const windowsSize = formatAssetSize(release.windows.sizeBytes);
  const publishedDate = formatReleaseDate(release.publishedAt);

  const androidSublabel = ["APK", androidSize].filter(Boolean).join(" · ");
  const windowsSublabel = ["Installer", windowsSize].filter(Boolean).join(" · ");

  return (
    <section id="download" className="mx-auto max-w-6xl px-6 py-20 md:py-28 border-t border-border">
      {/* Section Header */}
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-background font-mono text-[10px] font-bold">
            12
          </span>
          <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Get Zen
          </span>
        </div>
        <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Download &amp; Install
        </h2>
        <p className="max-w-3xl font-serif text-lg text-muted-foreground leading-relaxed">
          Direct downloads, always the latest release. No store, no account, no catch.
        </p>
        {(release.version || publishedDate) && (
          <p className="font-mono text-xs text-muted-foreground">
            {release.version && <span>{release.version}</span>}
            {release.version && publishedDate && <span> · </span>}
            {publishedDate && <span>Released {publishedDate}</span>}
            {" · "}
            <a href={ZEN_ALL_RELEASES_URL} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:text-foreground">
              All releases
            </a>
          </p>
        )}
      </div>

      {/* Download buttons */}
      <div className="mt-10">
        <ZenDownloadButtons
          androidHref={ZEN_ANDROID_APK_URL}
          androidSublabel={androidSublabel || undefined}
          windowsHref={ZEN_WINDOWS_INSTALLER_URL}
          windowsSublabel={windowsSublabel || undefined}
          size="full"
        />
      </div>

      {/* SHA-256 checksums */}
      {(release.android.sha256 || release.windows.sha256) && (
        <div className="mt-6 rounded-xl border border-neutral-800 bg-neutral-950 p-5 text-white">
          <p className="font-mono text-[11px] uppercase tracking-wider text-neutral-400 mb-3">
            SHA-256 checksums (from SHA256SUMS.txt)
          </p>
          <div className="flex flex-col gap-2.5">
            {release.android.sha256 && (
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-[11px] text-neutral-400 w-20 shrink-0">Zen.apk</span>
                <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-emerald-400">
                  {release.android.sha256}
                </code>
                <ZenCopyButton value={release.android.sha256} label="Zen.apk" />
              </div>
            )}
            {release.windows.sha256 && (
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="font-mono text-[11px] text-neutral-400 w-20 shrink-0">Setup.exe</span>
                <code className="min-w-0 flex-1 truncate font-mono text-[11px] text-emerald-400">
                  {release.windows.sha256}
                </code>
                <ZenCopyButton value={release.windows.sha256} label="ZenDesktopSetup.exe" />
              </div>
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
        </div>
      )}

      {/* Beta / personal project disclaimer */}
      <div className="mt-8 flex items-start gap-3 rounded-xl border border-amber-500/25 bg-amber-500/5 p-4">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">This is a personal project, in beta, provided as is.</span>{" "}
          It isn&apos;t distributed through the Play Store or the Microsoft Store, and neither
          installer is code-signed — see the notes below for what that means during
          install.
        </p>
      </div>

      {/* Install instructions: Android / Windows */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h3 className="font-sans text-base font-bold text-foreground">Installing on Android</h3>
          <ol className="mt-5 flex flex-col gap-4 text-sm">
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-secondary font-mono text-[10px] font-bold">1</span>
              <span>
                Download <span className="font-mono text-xs">Zen.apk</span> and open it. If
                prompted, allow your browser to <span className="font-medium">install unknown apps</span>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-secondary font-mono text-[10px] font-bold">2</span>
              <span>
                Google Play Protect may warn about an unknown developer — expected for any
                app installed outside the Play Store. Choose <span className="font-medium">Install anyway</span>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-secondary font-mono text-[10px] font-bold">3</span>
              <span>
                Open Zen and grant the permissions you want from Settings. On{" "}
                <span className="font-medium">Android 13 and up</span>, Accessibility and
                Usage access can appear greyed out as a &quot;restricted setting&quot; — tap Zen in
                Accessibility once and dismiss the popup, then go to{" "}
                <span className="font-mono text-xs">App info → ⋮ → Allow restricted settings</span>,
                then turn Accessibility (and Notification access) on.
              </span>
            </li>
          </ol>
          <p className="mt-5 font-mono text-[11px] text-muted-foreground">
            Requires Android 8.0 (Oreo) or newer, 64-bit.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
          <h3 className="font-sans text-base font-bold text-foreground">Installing on Windows</h3>
          <ol className="mt-5 flex flex-col gap-4 text-sm">
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-secondary font-mono text-[10px] font-bold">1</span>
              <span>
                Download and run <span className="font-mono text-xs">ZenDesktopSetup.exe</span>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-secondary font-mono text-[10px] font-bold">2</span>
              <span>
                Windows SmartScreen will likely show <span className="font-medium">&quot;Windows protected your PC&quot;</span> because
                the installer isn&apos;t code-signed. Click <span className="font-mono text-xs">More info → Run anyway</span>.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-secondary font-mono text-[10px] font-bold">3</span>
              <span>
                The installer needs no admin rights. It opens a setup wizard on first run —
                it walks you through the browser extension (loaded unpacked, in developer
                mode) and everything else in one pass.
              </span>
            </li>
          </ol>
          <p className="mt-5 font-mono text-[11px] text-muted-foreground">
            Requires Windows 10 (1809+) or Windows 11, 64-bit.
          </p>
        </div>
      </div>

      {/* Uninstall */}
      <div className="mt-8 rounded-xl border border-border bg-secondary/20 p-5">
        <h3 className="flex items-center gap-2 font-sans text-sm font-semibold text-foreground">
          <Trash2 className="h-4 w-4 text-muted-foreground" />
          Uninstalling
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          <span className="font-medium text-foreground">Android:</span> long-press the Zen
          icon (or app entry in the drawer) and choose Uninstall, same as any app — if Zen
          is your home screen, switch back to another launcher first in{" "}
          <span className="font-mono text-[11px]">Settings → Apps → Default apps → Home app</span>.{" "}
          <span className="font-medium text-foreground">Windows:</span>{" "}
          <span className="font-mono text-[11px]">Settings → Apps</span>, find Zen Desktop,
          and uninstall — or use the &quot;Uninstall Zen Desktop&quot; shortcut in the Start menu.
          You&apos;ll be asked whether to also delete your local Zen data.
        </p>
      </div>

      <div className="mt-6 flex items-start gap-2.5 text-xs text-muted-foreground">
        <ShieldQuestion className="h-4 w-4 shrink-0 mt-0.5" />
        <p>
          Both downloads come straight from GitHub Releases on the public{" "}
          <a
            href={ZEN_ALL_RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted hover:text-foreground"
          >
            zen-releases
          </a>{" "}
          repository — this link always points at the newest build.
        </p>
      </div>
    </section>
  );
}
