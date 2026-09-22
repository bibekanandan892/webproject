"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowDown,
  ArrowUp,
  Fingerprint,
  SunMoon,
  FolderPlus,
  Clock,
  Lock,
  Search,
  CheckCircle2,
} from "lucide-react";

interface ScreenTab {
  id: string;
  title: string;
  subtitle: string;
  imageSrc: string;
  bullets: string[];
}

const SCREENS: ScreenTab[] = [
  {
    id: "home",
    title: "Home Screen",
    subtitle: "Distraction-Free Sanctuary",
    imageSrc: "/zen/p1_home.png",
    bullets: [
      "Circular clock with integrated battery ring (animates while charging)",
      "12- or 24-hour display format with live date and calendar card",
      "Favorites comfortably positioned in the lower thumb zone",
      "Header modes: Clock + Age Meter stacked, tap to cycle, or single mode",
    ],
  },
  {
    id: "drawer",
    title: "App Drawer",
    subtitle: "Alphabetical & Instant Search",
    imageSrc: "/zen/p4_drawer_kb.png",
    bullets: [
      "Text-only clean A–Z list eliminates colorful icon dopamine traps",
      "Keyboard opens automatically the millisecond you swipe into the drawer",
      "Rapid A–Z jump rail on the right edge for instant alphabet navigation",
      "App folders to group utilities without distracting visual clutter",
    ],
  },
  {
    id: "favorites",
    title: "Thumb Zone Favorites",
    subtitle: "Pinned for Ergonomic Reach",
    imageSrc: "/zen/p3_home.png",
    bullets: [
      "Keep only your 2 to 6 essential tools directly on your home screen",
      "Pin, reorder, rename (emoji supported), or remove with zero friction",
      "No notification badges or glowing red dots provoking anxious unlocks",
      "Matches with solid monochrome lock-screen wallpaper",
    ],
  },
  {
    id: "notifications",
    title: "System Shade & Gestures",
    subtitle: "Natural Muscle-Memory",
    imageSrc: "/zen/p2_swipedown.png",
    bullets: [
      "Swipe down anywhere to drop your Android notification shade",
      "In-app time reminder countdown cards visible in system shade",
      "Quiet notification filter directs noisy alerts to Zen's local inbox",
      "Swipe up for web search, double tap to lock, long-press clock to flip theme",
    ],
  },
];

const GESTURES = [
  {
    gesture: "Swipe Left",
    action: "App Drawer",
    desc: "Opens the alphabetical app drawer; keyboard auto-focuses immediately.",
    icon: ArrowLeft,
  },
  {
    gesture: "Swipe Down",
    action: "Notifications",
    desc: "Pulls down the system notification shade from anywhere on the screen.",
    icon: ArrowDown,
  },
  {
    gesture: "Swipe Up",
    action: "Web Search",
    desc: "Triggers your configured browser or search app instantly.",
    icon: ArrowUp,
  },
  {
    gesture: "Double-Tap",
    action: "Lock Screen",
    desc: "Locks the display immediately without reaching for the physical power button.",
    icon: Lock,
  },
  {
    gesture: "Long-Press Clock",
    action: "Toggle Theme",
    desc: "Swaps instantly between crisp paper-light and deep obsidian-dark themes.",
    icon: SunMoon,
  },
];

const LONG_PRESS_ACTIONS = [
  { label: "Favorite", desc: "Pin or unpin from thumb zone" },
  { label: "Wait 15s", desc: "Mindful breathing countdown" },
  { label: "Block", desc: "1h to 30d unbypassable block" },
  { label: "Time Reminder", desc: "Session length with Exit/Extend" },
  { label: "Productive", desc: "Colorizes green in timeline" },
  { label: "Waste of Time", desc: "Colorizes red in timeline" },
  { label: "Grayscale", desc: "Per-app monochrome mode" },
  { label: "Filter Notifications", desc: "Hold alerts in Zen inbox" },
  { label: "Rename", desc: "Custom name or emoji" },
  { label: "Move to Folder", desc: "Group related tools" },
  { label: "Hide", desc: "Completely invisible from drawer" },
];

export function ZenScreenshots() {
  const [activeTab, setActiveTab] = useState<string>("home");

  const currentScreen = SCREENS.find((s) => s.id === activeTab) || SCREENS[0];

  return (
    <section className="mx-auto max-w-6xl px-6 py-20 md:py-28 border-t border-border">
      {/* Section Header */}
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-background font-mono text-[10px] font-bold">
            03
          </span>
          <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Interface & Ergonomics
          </span>
        </div>
        <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Clean Screens & Natural Gestures
        </h2>
        <p className="max-w-3xl font-serif text-lg text-muted-foreground leading-relaxed">
          Every interaction in Zen Launcher is designed to minimize cognitive friction.
          No cognitive load from neon icons, algorithmic badges, or infinite feeds.
        </p>
      </div>

      {/* Screen Tabs & Interactive Showcase */}
      <div className="mt-12 grid grid-cols-1 items-center gap-12 lg:grid-cols-12">
        {/* Left Column: Interactive Tab Descriptions */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* Tab selector buttons */}
          <div className="flex flex-wrap gap-2">
            {SCREENS.map((screen) => (
              <button
                key={screen.id}
                type="button"
                onClick={() => setActiveTab(screen.id)}
                className={`rounded-lg border px-4 py-2 font-sans text-xs font-medium transition-all ${
                  activeTab === screen.id
                    ? "border-foreground bg-foreground text-background shadow-xs font-semibold"
                    : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                }`}
              >
                {screen.title}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <span className="font-mono text-xs text-emerald-500 uppercase tracking-wider">
              {currentScreen.subtitle}
            </span>
            <h3 className="mt-1 font-sans text-2xl font-bold text-foreground">
              {currentScreen.title}
            </h3>

            <ul className="mt-6 flex flex-col gap-3">
              {currentScreen.bullets.map((bullet, idx) => (
                <li key={idx} className="flex items-start gap-3 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500 mt-0.5" />
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>

            {/* Long-press context menu breakdown when viewing drawer */}
            {activeTab === "drawer" && (
              <div className="mt-8 border-t border-border pt-6">
                <p className="font-mono text-xs text-foreground uppercase tracking-wider mb-3">
                  Long-Press Any App Context Menu:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {LONG_PRESS_ACTIONS.map((action, i) => (
                    <div
                      key={i}
                      className="rounded-lg border border-border/80 bg-secondary/30 p-2.5"
                    >
                      <p className="font-sans text-xs font-semibold text-foreground">
                        {action.label}
                      </p>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        {action.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Sleek Phone Mockup */}
        <div className="flex justify-center lg:col-span-5">
          <div className="relative w-[280px] sm:w-[310px] rounded-[48px] border-[10px] border-neutral-900 bg-black p-3 shadow-2xl ring-1 ring-white/10 dark:border-neutral-800">
            {/* Camera cutout */}
            <div className="absolute top-4 left-1/2 h-4 w-24 -translate-x-1/2 rounded-full bg-neutral-950 flex items-center justify-center z-20">
              <div className="h-2.5 w-2.5 rounded-full bg-neutral-900 border border-neutral-800 mr-2" />
              <div className="h-1.5 w-10 rounded-full bg-neutral-900" />
            </div>

            <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[36px] bg-black">
              <Image
                src={currentScreen.imageSrc}
                alt={currentScreen.title}
                fill
                sizes="(min-width: 640px) 310px, 280px"
                className="object-cover transition-opacity duration-300"
              />
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10" />
            </div>

            <div className="absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-neutral-700" />
          </div>
        </div>
      </div>

      {/* 5 Ergonomic Gestures Grid */}
      <div className="mt-16">
        <h3 className="font-sans text-lg font-bold text-foreground">
          Intuitive Edge-to-Edge Gestures
        </h3>
        <p className="text-sm text-muted-foreground">
          Zero searching for buttons. Navigate your entire phone through fast muscle-memory gestures.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {GESTURES.map((g) => {
            const Icon = g.icon;
            return (
              <div
                key={g.gesture}
                className="flex flex-col rounded-xl border border-border bg-card p-4 transition-all hover:border-foreground/30 hover:shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-foreground">
                    {g.gesture}
                  </span>
                  <span className="flex h-7 w-7 items-center justify-center rounded-md bg-secondary text-foreground">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                </div>
                <p className="mt-3 font-sans text-sm font-semibold text-foreground">
                  {g.action}
                </p>
                <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                  {g.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
