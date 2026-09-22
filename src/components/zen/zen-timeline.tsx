"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Eye, Sparkles, Smartphone, Check, HelpCircle } from "lucide-react";

interface HourDetail {
  hour: number;
  timeLabel: string;
  productiveMinutes: number;
  funMinutes: number;
  wasteMinutes: number;
  offPhoneMinutes: number;
  topApps: { name: string; duration: string; kind: "productive" | "fun" | "waste" }[];
}

const SAMPLE_HOURS: HourDetail[] = [
  {
    hour: 9,
    timeLabel: "09:00 – 10:00",
    productiveMinutes: 45,
    funMinutes: 5,
    wasteMinutes: 0,
    offPhoneMinutes: 10,
    topApps: [
      { name: "Obsidian", duration: "25m", kind: "productive" },
      { name: "Linear", duration: "20m", kind: "productive" },
      { name: "Chrome (docs)", duration: "5m", kind: "fun" },
    ],
  },
  {
    hour: 12,
    timeLabel: "12:00 – 13:00",
    productiveMinutes: 0,
    funMinutes: 0,
    wasteMinutes: 0,
    offPhoneMinutes: 60,
    topApps: [],
  },
  {
    hour: 14,
    timeLabel: "14:00 – 15:00",
    productiveMinutes: 38,
    funMinutes: 12,
    wasteMinutes: 0,
    offPhoneMinutes: 10,
    topApps: [
      { name: "YouTube (Karpathy LLM)", duration: "30m", kind: "productive" },
      { name: "Terminal / SSH", duration: "8m", kind: "productive" },
      { name: "WhatsApp", duration: "12m", kind: "fun" },
    ],
  },
  {
    hour: 16,
    timeLabel: "16:00 – 17:00",
    productiveMinutes: 15,
    funMinutes: 20,
    wasteMinutes: 20,
    offPhoneMinutes: 5,
    topApps: [
      { name: "YouTube Shorts", duration: "20m", kind: "waste" },
      { name: "Reddit", duration: "20m", kind: "fun" },
      { name: "Coursera", duration: "15m", kind: "productive" },
    ],
  },
  {
    hour: 18,
    timeLabel: "18:00 – 19:00",
    productiveMinutes: 0,
    funMinutes: 0,
    wasteMinutes: 0,
    offPhoneMinutes: 60,
    topApps: [],
  },
];

export function ZenTimeline() {
  const [glanceEnabled, setGlanceEnabled] = useState(true);
  const [zoomEnabled, setZoomEnabled] = useState(true);
  const [activeHourIndex, setActiveHourIndex] = useState(2); // 14:00

  const currentHourData = SAMPLE_HOURS[activeHourIndex];

  return (
    <section id="timeline" className="mx-auto max-w-6xl px-6 py-20 md:py-28 border-t border-border">
      {/* Section Header */}
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-background font-mono text-[10px] font-bold">
            02
          </span>
          <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Visual Feedback Loop
          </span>
        </div>
        <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Today's Timeline: What the Colors Mean
        </h2>
        <p className="max-w-3xl font-serif text-lg text-muted-foreground leading-relaxed">
          Zen Launcher doesn't just shame you with generic screen-time graphs. It classifies
          your exact digital diet into high-signal semantic categories right beneath your clock.
        </p>
      </div>

      {/* Color Legend Cards */}
      <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Productive */}
        <div className="flex flex-col rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
          <div className="flex items-center gap-2.5">
            <span className="h-3.5 w-3.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/30" />
            <h3 className="font-sans text-base font-semibold text-emerald-600 dark:text-emerald-400">
              Productive
            </h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Apps you explicitly mark productive, educational videos tagged as Learn,
            and research websites.
          </p>
          <div className="mt-3 flex flex-wrap gap-1 font-mono text-[10px] text-emerald-700 dark:text-emerald-300">
            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5">Obsidian</span>
            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5">Learn Videos</span>
            <span className="rounded bg-emerald-500/15 px-1.5 py-0.5">Docs</span>
          </div>
        </div>

        {/* Fun & other */}
        <div className="flex flex-col rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
          <div className="flex items-center gap-2.5">
            <span className="h-3.5 w-3.5 rounded-full bg-amber-500 ring-2 ring-amber-500/30" />
            <h3 className="font-sans text-base font-semibold text-amber-600 dark:text-amber-400">
              Fun & Other
            </h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Entertainment videos, leisure browsing, messaging, and any standard app
            not specifically flagged.
          </p>
          <div className="mt-3 flex flex-wrap gap-1 font-mono text-[10px] text-amber-700 dark:text-amber-300">
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5">YouTube Fun</span>
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5">WhatsApp</span>
            <span className="rounded bg-amber-500/15 px-1.5 py-0.5">Music</span>
          </div>
        </div>

        {/* Waste */}
        <div className="flex flex-col rounded-xl border border-rose-500/20 bg-rose-500/5 p-5">
          <div className="flex items-center gap-2.5">
            <span className="h-3.5 w-3.5 rounded-full bg-rose-500 ring-2 ring-rose-500/30" />
            <h3 className="font-sans text-base font-semibold text-rose-600 dark:text-rose-400">
              Waste of Time
            </h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            YouTube Shorts (detected instantly on screen) and any addictive apps you
            marked as "waste of time".
          </p>
          <div className="mt-3 flex flex-wrap gap-1 font-mono text-[10px] text-rose-700 dark:text-rose-300">
            <span className="rounded bg-rose-500/15 px-1.5 py-0.5">YouTube Shorts</span>
            <span className="rounded bg-rose-500/15 px-1.5 py-0.5">Doomscroll</span>
            <span className="rounded bg-rose-500/15 px-1.5 py-0.5">Waste Tag</span>
          </div>
        </div>

        {/* Screen-free Breaks */}
        <div className="flex flex-col rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-2.5">
            <span
              className="h-3.5 w-3.5 rounded-xs border border-neutral-400"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, #888 0, #888 1px, transparent 0, transparent 50%)",
                backgroundSize: "4px 4px",
              }}
            />
            <h3 className="font-sans text-base font-semibold text-foreground">
              Screen-free ░
            </h3>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            An hour or more away from your device (phone off or locked). Represented by a
            fine 3px pixel checker pattern.
          </p>
          <div className="mt-3 flex flex-wrap gap-1 font-mono text-[10px] text-muted-foreground">
            <span className="rounded bg-secondary px-1.5 py-0.5">≥1h Away</span>
            <span className="rounded bg-secondary px-1.5 py-0.5">Deep Focus</span>
            <span className="rounded bg-secondary px-1.5 py-0.5">Night Rest</span>
          </div>
        </div>
      </div>

      {/* Interactive Timeline Bar & Switches Container */}
      <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8 shadow-sm">
        {/* Toggle Switches Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-6">
          <div>
            <h3 className="font-sans text-base font-semibold text-foreground">
              Timeline Simulation Engine
            </h3>
            <p className="text-xs text-muted-foreground">
              Test Zen's "Today at a glance" packing and tap-to-zoom hour inspector.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Switch 1: Glance */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="font-sans text-xs font-medium text-foreground">
                Today at a glance
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={glanceEnabled}
                onClick={() => setGlanceEnabled(!glanceEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-in-out ${
                  glanceEnabled ? "bg-foreground" : "bg-secondary"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-background transition duration-200 ease-in-out mt-0.5 ${
                    glanceEnabled ? "translate-x-5.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>

            {/* Switch 2: Hour Zoom */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="font-sans text-xs font-medium text-foreground">
                Hour zoom
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={zoomEnabled}
                onClick={() => setZoomEnabled(!zoomEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-in-out ${
                  zoomEnabled ? "bg-foreground" : "bg-secondary"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-background transition duration-200 ease-in-out mt-0.5 ${
                    zoomEnabled ? "translate-x-5.5" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>
          </div>
        </div>

        {/* Visual Timeline Bar Simulation */}
        <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-950 p-6 text-white shadow-inner">
          <div className="flex items-center justify-between font-mono text-xs text-neutral-400">
            <span className="text-white font-semibold">TODAY TIMELINE</span>
            <span className="rounded bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 text-[11px]">
              1h 5m productive total
            </span>
          </div>

          {/* Today at a Glance Bar */}
          {glanceEnabled && (
            <div className="mt-4">
              <div className="flex justify-between font-mono text-[11px] text-neutral-400 mb-1.5">
                <span>00:00 (Midnight)</span>
                <span className="text-white">Now (17:00)</span>
                <span>24:00 (Hours Ahead in Gray)</span>
              </div>

              {/* The proportional condensed glance bar */}
              <div className="flex h-7 w-full overflow-hidden rounded-md border border-neutral-800 bg-neutral-900">
                {/* 00:00 - 08:00 Overnight Screen-free (░) */}
                <div
                  className="h-full relative"
                  style={{
                    width: "33.3%",
                    backgroundImage:
                      "repeating-linear-gradient(45deg, #555 0, #555 1.5px, transparent 0, transparent 4px)",
                  }}
                  title="Overnight screen-free break (8h)"
                />
                {/* 08:00 - 10:00 Productive (Green) */}
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: "8.3%" }}
                  title="Productive session: Obsidian & Docs (1h 5m)"
                />
                {/* 10:00 - 12:00 Fun (Orange) */}
                <div
                  className="h-full bg-amber-500"
                  style={{ width: "8.3%" }}
                  title="Fun / messaging (1h)"
                />
                {/* 12:00 - 13:00 Lunch Screen-free (░) */}
                <div
                  className="h-full"
                  style={{
                    width: "4.1%",
                    backgroundImage:
                      "repeating-linear-gradient(45deg, #555 0, #555 1.5px, transparent 0, transparent 4px)",
                  }}
                  title="Screen-free break (1h)"
                />
                {/* 13:00 - 15:00 Learn videos & Work (Green) */}
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: "8.3%" }}
                  title="Productive Learn videos (1h)"
                />
                {/* 15:00 - 16:30 Shorts / Waste (Red) */}
                <div
                  className="h-full bg-rose-500"
                  style={{ width: "6.2%" }}
                  title="Waste: YouTube Shorts (45m)"
                />
                {/* 16:30 - 17:00 Passed unclassified (White) */}
                <div
                  className="h-full bg-neutral-200"
                  style={{ width: "2.5%" }}
                  title="Rest of passed time (30m)"
                />
                {/* 17:00 - 24:00 Hours Ahead (Gray) */}
                <div
                  className="h-full bg-neutral-800 border-l border-neutral-700"
                  style={{ width: "29%" }}
                  title="Hours ahead in gray (7h remaining)"
                />
              </div>

              <div className="mt-2 flex flex-wrap items-center gap-3 font-mono text-[10px] text-neutral-400">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-xs bg-emerald-500" /> Productive
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-xs bg-amber-500" /> Fun
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-xs bg-rose-500" /> Waste
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-xs bg-neutral-500" /> ░ Screen-free
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-xs bg-neutral-200" /> Passed
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-xs bg-neutral-800 border border-neutral-600" /> Hours ahead
                </span>
              </div>
            </div>
          )}

          {/* Interactive Hour Zoom Inspector */}
          {zoomEnabled && (
            <div className="mt-8 border-t border-neutral-800 pt-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-neutral-800 px-2 py-0.5 font-mono text-xs text-emerald-400">
                    Hour Zoom Active
                  </span>
                  <span className="font-mono text-xs text-neutral-300">
                    Tap any sample hour to inspect:
                  </span>
                </div>

                {/* Step controls ‹ › */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      setActiveHourIndex((prev) =>
                        prev > 0 ? prev - 1 : SAMPLE_HOURS.length - 1
                      )
                    }
                    className="flex h-7 w-7 items-center justify-center rounded border border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
                    aria-label="Previous hour"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="font-mono text-xs text-white px-1">
                    {currentHourData.timeLabel}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setActiveHourIndex((prev) =>
                        prev < SAMPLE_HOURS.length - 1 ? prev + 1 : 0
                      )
                    }
                    className="flex h-7 w-7 items-center justify-center rounded border border-neutral-700 bg-neutral-900 text-neutral-300 hover:bg-neutral-800"
                    aria-label="Next hour"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Hour selector buttons */}
              <div className="mt-3 flex flex-wrap gap-2">
                {SAMPLE_HOURS.map((h, i) => (
                  <button
                    key={h.hour}
                    type="button"
                    onClick={() => setActiveHourIndex(i)}
                    className={`rounded border px-2.5 py-1 font-mono text-xs transition-colors ${
                      i === activeHourIndex
                        ? "border-emerald-400 bg-emerald-950/60 text-white font-bold"
                        : "border-neutral-800 bg-neutral-900 text-neutral-400 hover:border-neutral-700 hover:text-white"
                    }`}
                  >
                    {h.timeLabel}
                  </button>
                ))}
              </div>

              {/* The Zoomed 60-Minute Bar */}
              <div className="mt-5 rounded-lg border border-neutral-800 bg-neutral-900/80 p-4">
                <div className="flex justify-between font-mono text-xs text-neutral-300 mb-2">
                  <span>ZOOMED 60-MINUTE BAR ({currentHourData.timeLabel})</span>
                  <span>{60 - currentHourData.offPhoneMinutes}m phone · {currentHourData.offPhoneMinutes}m off</span>
                </div>

                {/* 60 minute visual breakdown */}
                <div className="flex h-5 w-full overflow-hidden rounded bg-neutral-800">
                  {currentHourData.productiveMinutes > 0 && (
                    <div
                      className="bg-emerald-500 h-full"
                      style={{ width: `${(currentHourData.productiveMinutes / 60) * 100}%` }}
                      title={`${currentHourData.productiveMinutes}m Productive`}
                    />
                  )}
                  {currentHourData.funMinutes > 0 && (
                    <div
                      className="bg-amber-500 h-full"
                      style={{ width: `${(currentHourData.funMinutes / 60) * 100}%` }}
                      title={`${currentHourData.funMinutes}m Fun`}
                    />
                  )}
                  {currentHourData.wasteMinutes > 0 && (
                    <div
                      className="bg-rose-500 h-full"
                      style={{ width: `${(currentHourData.wasteMinutes / 60) * 100}%` }}
                      title={`${currentHourData.wasteMinutes}m Waste`}
                    />
                  )}
                  {currentHourData.offPhoneMinutes > 0 && (
                    <div
                      className="h-full"
                      style={{
                        width: `${(currentHourData.offPhoneMinutes / 60) * 100}%`,
                        backgroundImage:
                          "repeating-linear-gradient(45deg, #444 0, #444 1.5px, transparent 0, transparent 4px)",
                      }}
                      title={`${currentHourData.offPhoneMinutes}m Off-phone`}
                    />
                  )}
                </div>

                {/* Top 3 Apps in this hour */}
                <div className="mt-4">
                  <p className="font-mono text-[11px] text-neutral-400 mb-1.5 uppercase">
                    Top Apps / Off-Phone Breakdown:
                  </p>
                  {currentHourData.topApps.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {currentHourData.topApps.map((app, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between rounded border border-neutral-800 bg-neutral-950 px-3 py-2 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                app.kind === "productive"
                                  ? "bg-emerald-400"
                                  : app.kind === "fun"
                                  ? "bg-amber-400"
                                  : "bg-rose-400"
                              }`}
                            />
                            <span className="text-neutral-200 truncate max-w-[130px]">
                              {app.name}
                            </span>
                          </div>
                          <span className="font-mono text-neutral-400 text-[11px]">
                            {app.duration}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-neutral-400 italic">
                      Zero phone activity. Pure screen-free restoration (60m).
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
