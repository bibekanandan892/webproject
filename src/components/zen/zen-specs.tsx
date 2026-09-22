"use client";

import {
  Download,
  Terminal,
  Info,
  Layers,
  Cpu,
  Smartphone,
  ExternalLink,
  Laptop,
} from "lucide-react";
import { GithubIcon } from "@/components/social-icons";

const GOOD_TO_KNOW = [
  {
    title: "Distribution via Direct APK",
    desc: "Not distributed on Google Play Store due to high-privilege focus permissions (Accessibility, Draw-Over-Apps, Notification Access). Download and install directly via GitHub Releases or build from source.",
  },
  {
    title: "Package Size Breakdown",
    desc: "Full APK is ~27 MB, largely composed of Google's native MediaPipe GenAI on-device inference runtime. A ~2 MB ultra-lite build without on-device AI is also supported.",
  },
  {
    title: "AI Model Download (555 MB)",
    desc: "The Gemma 3 1B LLM model weights are not bundled in the APK to keep installs nimble. Download the .task file once from Hugging Face for free and select it in Zen settings.",
  },
  {
    title: "Browser Scope: Chrome",
    desc: "Website domain telemetry and tab tracking currently support Google Chrome. Support for Firefox and Brave is planned.",
  },
  {
    title: "Metrics Retention Window",
    desc: "Per-app, per-site, and per-video breakdowns display granular logs for today. The 7-day overview chart summarizes rolling week trends across Learn, Fun, and Waste.",
  },
  {
    title: "Video Titles Tracking",
    desc: "Video title logging is active from v0.1.0 onwards. Previous watch history displays aggregated channel-level duration.",
  },
];

const SPECS_TABLE = [
  { label: "App Version", value: "0.1.0 (Released 21 Sep 2026)" },
  { label: "Package Identifier", value: "com.bibek.zen (Debug: com.bibek.zen.debug)" },
  { label: "OS Compatibility", value: "Android 8.0+ (Oreo, API 26+) · 64-bit architectures" },
  { label: "Language & UI Framework", value: "Kotlin 2.0 · Jetpack Compose (Material 3)" },
  { label: "Local Database", value: "Room SQLite (Schema version 13 with verified migrations)" },
  { label: "Dependency Injection", value: "Hilt / Dagger" },
  { label: "AI Engine", value: "Google MediaPipe GenAI tasks-genai · Gemma 3 1B on-device" },
  { label: "Desktop Companion", value: "Zen Desktop (.NET 8 WPF · 4-State Attention Engine)" },
];

export function ZenSpecs() {
  return (
    <section id="specs" className="mx-auto max-w-6xl px-6 py-20 md:py-28 border-t border-border">
      {/* Section Header */}
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-background font-mono text-[10px] font-bold">
            07
          </span>
          <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Specifications & Transparency
          </span>
        </div>
        <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Technical Specifications & Notes
        </h2>
        <p className="max-w-3xl font-serif text-lg text-muted-foreground leading-relaxed">
          Full technical clarity on what Zen includes, how it is built, and what to
          expect when sideloading.
        </p>
      </div>

      {/* Good to Know Cards */}
      <div className="mt-12">
        <h3 className="font-sans text-lg font-bold text-foreground mb-6 flex items-center gap-2">
          <Info className="h-5 w-5 text-muted-foreground" />
          <span>Good to Know</span>
        </h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GOOD_TO_KNOW.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col rounded-xl border border-border bg-card p-5 transition-colors hover:border-foreground/30"
            >
              <h4 className="font-sans text-sm font-semibold text-foreground">
                {item.title}
              </h4>
              <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Specifications Table */}
      <div className="mt-14 overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border bg-secondary/30 px-6 py-4">
          <h3 className="font-sans text-sm font-semibold text-foreground">
            System Specifications & Architecture
          </h3>
        </div>

        <div className="divide-y divide-border font-sans text-xs">
          {SPECS_TABLE.map((row, i) => (
            <div
              key={i}
              className="grid grid-cols-1 py-3.5 px-6 sm:grid-cols-12 sm:items-center"
            >
              <span className="font-medium text-muted-foreground sm:col-span-4">
                {row.label}
              </span>
              <span className="font-mono text-foreground sm:col-span-8">
                {row.value}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Sideload & ADB Quick Commands */}
      <div className="mt-12 rounded-2xl border border-border bg-neutral-950 p-6 sm:p-8 text-white shadow-xl">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-800 pb-4">
          <div className="flex items-center gap-2 font-mono text-xs text-emerald-400">
            <Terminal className="h-4 w-4" />
            <span>QUICK SETUP VIA ADB (OPTIONAL)</span>
          </div>
          <span className="font-mono text-[11px] text-neutral-400">
            Package: com.bibek.zen
          </span>
        </div>

        <p className="mt-4 font-sans text-xs text-neutral-300 leading-relaxed max-w-2xl">
          While all permissions can be comfortably granted directly within the in-app
          Settings screen, you can also grant full permissions immediately over USB:
        </p>

        <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900/90 p-4 font-mono text-xs text-emerald-400 overflow-x-auto space-y-1.5">
          <p className="text-neutral-500"># 1. Overlay (Wait timer & unbypassable block screens)</p>
          <p className="text-neutral-200">adb shell appops set com.bibek.zen SYSTEM_ALERT_WINDOW allow</p>
          <p className="text-neutral-500 mt-2"># 2. Accessibility (Foreground app detection & Zen Focus)</p>
          <p className="text-neutral-200">adb shell settings put secure enabled_accessibility_services com.bibek.zen/com.bibek.zen.service.accessibility.ZenAccessibilityService</p>
          <p className="text-neutral-500 mt-2"># 3. Screen time stats & notification filter</p>
          <p className="text-neutral-200">adb shell appops set com.bibek.zen android:get_usage_stats allow</p>
          <p className="text-neutral-200">adb shell cmd notification allow_listener com.bibek.zen/com.bibek.zen.service.notification.ZenNotificationListenerService</p>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-800 pt-4">
          <p className="font-mono text-xs text-neutral-400">
            Source code is available under MIT on GitHub.
          </p>
          <a
            href="https://github.com/bibekanandan892/zen-launcher"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-white/20 bg-white px-4 py-2 font-sans text-xs font-semibold text-black transition-opacity hover:opacity-90"
          >
            <GithubIcon className="h-3.5 w-3.5" />
            <span>Clone / Build on GitHub</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>
    </section>
  );
}
