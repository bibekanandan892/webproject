"use client";

import { ShieldCheck, Lock, Database, EyeOff, CheckCircle2, AlertCircle } from "lucide-react";

const PERMISSIONS = [
  {
    name: "Usage Access",
    badge: "Optional",
    purpose: "Calculates total app screen time, today's timeline bars, and screen-free breaks.",
    technical: "Reads standard Android UsageStatsManager event intervals. Does not read content.",
    status: "Granted via Android Settings → Usage Access",
  },
  {
    name: "Accessibility (Zen Focus)",
    badge: "Optional",
    purpose: "Powers wait timers, unskippable app blocking, per-app grayscale, YouTube Shorts isolation, Chrome domain tracking, and unlock rewards.",
    technical: "canRetrieveWindowContent is strictly FALSE. Only inspects the foreground package/activity class name. Never reads typed text, passwords, or on-screen content.",
    status: "Granted via Android Settings → Accessibility",
  },
  {
    name: "Notification Access",
    badge: "Optional",
    purpose: "Tracks active YouTube video playback duration (via media session notifications) and routes distracting apps to Zen's quiet in-app inbox.",
    technical: "Filtered notifications are saved in a local Room database capped at the 200 newest items and completely excluded from cloud backups.",
    status: "Granted via Android Settings → Notification Listener",
  },
  {
    name: "Write Secure Settings (ADB)",
    badge: "Optional · One-Time",
    purpose: "Enables per-app monochrome (system-level grayscale toggle).",
    technical: "Requires a single adb pm grant command. Completely optional if you don't use grayscale.",
    status: "Granted once via adb shell pm grant",
  },
];

export function ZenPrivacy() {
  return (
    <section id="privacy" className="mx-auto max-w-6xl px-6 py-20 md:py-28 border-t border-border">
      {/* Section Header */}
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-background font-mono text-[10px] font-bold">
            06
          </span>
          <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Trust & Security
          </span>
        </div>
        <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Privacy & Permissions: Each Strictly Optional
        </h2>
        <p className="max-w-3xl font-serif text-lg text-muted-foreground leading-relaxed">
          Zen Launcher has zero analytics SDKs, zero cloud tracking, zero remote servers,
          and zero telemetry. Every capability is powered strictly by local Android APIs.
        </p>
      </div>

      {/* Core Privacy Pillars */}
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
            <Database className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-sans text-base font-semibold text-foreground">
            100% Local SQLite DB
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            All usage metrics, schedules, favorites, and watch logs live solely inside
            an encrypted Room database on your physical device.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
            <EyeOff className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-sans text-base font-semibold text-foreground">
            No Screen Scraping
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Zen Focus sets <code className="font-mono text-[11px] bg-secondary px-1 py-0.5 rounded">canRetrieveWindowContent="false"</code>.
            It knows which app is open, but can never see what you read, write, or type.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
            <Lock className="h-5 w-5" />
          </div>
          <h3 className="mt-4 font-sans text-base font-semibold text-foreground">
            Excluded from Backups
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Your notification inbox and sensitive usage logs are explicitly excluded from
            Google Drive and Android cloud transfers (<code className="font-mono text-[11px] bg-secondary px-1 py-0.5 rounded">data_extraction_rules.xml</code>).
          </p>
        </div>
      </div>

      {/* Permissions Breakdown Table */}
      <div className="mt-10 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-secondary/30 px-6 py-4">
          <h3 className="font-sans text-sm font-semibold text-foreground">
            Permission Manifest & System Access Map
          </h3>
          <p className="text-xs text-muted-foreground">
            Every permission is requested just-in-time only when you enable the corresponding feature.
          </p>
        </div>

        <div className="divide-y divide-border">
          {PERMISSIONS.map((perm) => (
            <div
              key={perm.name}
              className="grid grid-cols-1 gap-4 p-6 sm:grid-cols-12 sm:items-start"
            >
              <div className="sm:col-span-4">
                <div className="flex items-center gap-2">
                  <p className="font-sans text-sm font-semibold text-foreground">
                    {perm.name}
                  </p>
                  <span className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                    {perm.badge}
                  </span>
                </div>
                <p className="mt-1 font-mono text-[11px] text-muted-foreground">
                  {perm.status}
                </p>
              </div>

              <div className="sm:col-span-8 flex flex-col gap-1.5">
                <p className="text-xs text-foreground leading-relaxed">
                  <span className="font-semibold">Why it's needed:</span> {perm.purpose}
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-mono text-[11px] text-foreground">Under the hood:</span> {perm.technical}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
