"use client";

import {
  Timer,
  ShieldAlert,
  CalendarDays,
  Hourglass,
  Palette,
  Inbox,
  BarChart3,
  Video,
  Globe,
  Brain,
  SlidersHorizontal,
  CheckCircle2,
  Sparkles,
  Zap,
} from "lucide-react";

export function ZenFeatures() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-6 py-20 md:py-28 border-t border-border">
      {/* Section Header */}
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-background font-mono text-[10px] font-bold">
            04
          </span>
          <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Product Capabilities
          </span>
        </div>
        <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Complete Feature Architecture
        </h2>
        <p className="max-w-3xl font-serif text-lg text-muted-foreground leading-relaxed">
          From unskippable app blockers and mindful breathing wait timers to on-device
          Gemma 3 1B AI classification, Zen Launcher is engineered for intentional living.
        </p>
      </div>

      {/* Grid of Major Feature Domains */}
      <div className="mt-12 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
        {/* Domain 1: Focus & Wellbeing */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
              <Hourglass className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-sans text-base font-bold text-foreground">
                Focus & Wellbeing
              </h3>
              <p className="text-xs text-muted-foreground">Friction against impulse</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 text-xs">
            <div>
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Timer className="h-3.5 w-3.5 text-muted-foreground" />
                Wait Timer
              </p>
              <p className="mt-0.5 text-muted-foreground leading-relaxed">
                A short breathing countdown before an app opens. Breaks muscle-memory
                phone pickups and prevents subconscious mindless launches.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-muted-foreground" />
                Unbypassable App Blocker
              </p>
              <p className="mt-0.5 text-muted-foreground leading-relaxed">
                Lock out any app from 1 hour to 30 days. Auto-expires, strictly unskippable.
                Overlay window cannot be bypassed or closed.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-muted-foreground" />
                Blocking Schedules
              </p>
              <p className="mt-0.5 text-muted-foreground leading-relaxed">
                Block sets of apps automatically on chosen days and timeframes (supports
                overnight schedules e.g., 22:00 to 07:00).
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-muted-foreground" />
                Per-App Grayscale
              </p>
              <p className="mt-0.5 text-muted-foreground leading-relaxed">
                Drains the color while a chosen app is open, eliminating high-contrast
                dopamine cues while leaving your phone normal elsewhere.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Inbox className="h-3.5 w-3.5 text-muted-foreground" />
                Quiet Notification Inbox
              </p>
              <p className="mt-0.5 text-muted-foreground leading-relaxed">
                Intercepts distracting alerts and holds them safely in Zen's own local inbox.
                Review them on your schedule without status bar dings.
              </p>
            </div>
          </div>
        </div>

        {/* Domain 2: Granular Screen Time & Activity Tabs */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm md:col-span-1 lg:col-span-1">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
              <BarChart3 className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-sans text-base font-bold text-foreground">
                Screen Time Engine
              </h3>
              <p className="text-xs text-muted-foreground">True usage without inflation</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 text-xs">
            <div>
              <p className="font-semibold text-foreground">Apps Tab</p>
              <p className="mt-0.5 text-muted-foreground leading-relaxed">
                Productive-time switch, 7-day visual chart (Learn · Fun · Waste · rest of
                phone time; tap any day for numbers), and time per app today.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground">Websites Tab</p>
              <p className="mt-0.5 text-muted-foreground leading-relaxed">
                Chrome tracking switch, time per site today grouped cleanly by domain,
                with its assigned Learn/Fun tag.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground">YouTube Tab</p>
              <p className="mt-0.5 text-muted-foreground leading-relaxed">
                Dedicated switch; partitions today's watch time into Learn, Fun, Shorts,
                and untagged. Logs exact time per channel and per video.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground">Anti-Inflation Filter</p>
              <p className="mt-0.5 text-muted-foreground leading-relaxed">
                Stuck screens (Recents view, incoming call screens, notification shades,
                system overlays) no longer artificially inflate active app time.
              </p>
            </div>
          </div>
        </div>

        {/* Domain 3: YouTube & Website Precision */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm md:col-span-1 lg:col-span-1">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
              <Video className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-sans text-base font-bold text-foreground">
                Media & Web Telemetry
              </h3>
              <p className="text-xs text-muted-foreground">Active watch duration only</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-4 text-xs">
            <div>
              <p className="font-semibold text-foreground">Long Videos vs Idle</p>
              <p className="mt-0.5 text-muted-foreground leading-relaxed">
                Only time actually playing media counts. Paused tabs or background idle
                do not inflate stats. Saves channel name and video title.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground">Shorts Isolation</p>
              <p className="mt-0.5 text-muted-foreground leading-relaxed">
                Detected directly on screen via accessibility heuristics and isolated
                separately as Waste, distinct from long-form educational watch time.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground">Chrome Domain Tracking</p>
              <p className="mt-0.5 text-muted-foreground leading-relaxed">
                Extracts top-level domains in real-time. Well-known domains (GitHub,
                Wikipedia, Arxiv) are pre-tagged from a built-in list.
              </p>
            </div>

            <div>
              <p className="font-semibold text-foreground">User Tag Authority</p>
              <p className="mt-0.5 text-muted-foreground leading-relaxed">
                Tap Learn or Fun on any channel or site. Your personal manual tag always
                wins over automated heuristics. Untagged items are surfaced first.
              </p>
            </div>
          </div>
        </div>

        {/* Domain 4: On-Device AI Classification (Gemma 3 1B) */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm md:col-span-2 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
                <Brain className="h-4 w-4" />
              </span>
              <div>
                <h3 className="font-sans text-base font-bold text-foreground">
                  On-Device AI Tagging: Gemma 3 1B
                </h3>
                <p className="text-xs text-muted-foreground">
                  Powered by Google MediaPipe GenAI · 100% Offline
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 rounded border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
              Zero Network Calls
            </span>
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs">
            <div className="rounded-xl border border-border/70 bg-secondary/30 p-4">
              <p className="font-semibold text-foreground font-sans">
                Autonomous Local Inference
              </p>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                Runs Google's Gemma 3 1B model natively on your phone's processor via
                MediaPipe. Completely free, works offline, and sends zero bytes over the air.
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-secondary/30 p-4">
              <p className="font-semibold text-foreground font-sans">
                Gentle Background Tagging
              </p>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                Tags new channels and websites as Learn or Fun every 3 hours (only when
                battery is not low), 2 hours after first seen. Max 2 tries each; manual "Tag now" button.
              </p>
            </div>

            <div className="rounded-xl border border-border/70 bg-secondary/30 p-4">
              <p className="font-semibold text-foreground font-sans">
                One-Time Private Setup
              </p>
              <p className="mt-1 text-muted-foreground leading-relaxed">
                Download the Gemma 3 1B model file (555 MB with a free Hugging Face account)
                once, pick it with Android's system file picker in Zen, and it is ready.
              </p>
            </div>
          </div>
        </div>

        {/* Domain 5: Settings & Look */}
        <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm md:col-span-2 lg:col-span-1">
          <div className="flex items-center gap-3 border-b border-border pb-4">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            <div>
              <h3 className="font-sans text-base font-bold text-foreground">
                Settings & Aesthetic
              </h3>
              <p className="text-xs text-muted-foreground">Monochrome design craft</p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2.5 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
              <span>Dark or light theme, toggled via long-press clock or settings</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
              <span>24-hour or 12-hour clock format, double-tap anywhere to lock</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
              <span>Custom outline-free ZenSwitch controls with smooth pill transitions</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
              <span>Settings → Age meter holds all Memento Mori horizon preferences</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-emerald-500 mt-0.5" />
              <span>Settings → Screen time centralizes all tracking switches</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
