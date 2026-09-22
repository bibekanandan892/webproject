"use client";

import { useState } from "react";
import { Sparkles, Trophy, Moon, Play, Check, ShieldCheck } from "lucide-react";

type BreakAnimation = "Ticks" | "Day sweep" | "Fade";

export function ZenScreenFree() {
  const [selectedAnimation, setSelectedAnimation] = useState<BreakAnimation>("Ticks");
  const [isPlaying, setIsPlaying] = useState(false);

  function triggerPreview() {
    setIsPlaying(true);
    setTimeout(() => {
      setIsPlaying(false);
    }, 2400);
  }

  return (
    <section id="breaks" className="mx-auto max-w-6xl px-6 py-20 md:py-28 border-t border-border">
      {/* Section Header */}
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-background font-mono text-[10px] font-bold">
            05
          </span>
          <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Mindful Incentives
          </span>
        </div>
        <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Screen-Free Breaks & Unlock Rewards
        </h2>
        <p className="max-w-3xl font-serif text-lg text-muted-foreground leading-relaxed">
          Most launchers only nag you about usage. Zen rewards your absence.
          Spend an hour or more away from your screen, and Zen greets you upon unlock with
          a serene visual milestone.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12 items-center">
        {/* Left Column: Rules & Philosophy */}
        <div className="flex flex-col gap-6 lg:col-span-6">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h3 className="font-sans text-xl font-bold text-foreground">
              How Break Detection Works
            </h3>

            <div className="mt-6 flex flex-col gap-4 text-xs text-muted-foreground">
              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-secondary font-mono text-xs font-bold text-foreground">
                  1
                </span>
                <div>
                  <p className="font-sans font-semibold text-foreground text-sm">
                    Lock to Unlock Window
                  </p>
                  <p className="mt-0.5 leading-relaxed">
                    Measured between when the device screen locks and when you next unlock it.
                    Phone-off time counts as valid screen-free duration.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-secondary font-mono text-xs font-bold text-foreground">
                  2
                </span>
                <div>
                  <p className="font-sans font-semibold text-foreground text-sm">
                    Glance Tolerance
                  </p>
                  <p className="mt-0.5 leading-relaxed">
                    Quick lock-screen glances (checking notifications or the time for &lt;60 seconds)
                    do not break your streak. Your break remains unbroken.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-secondary font-mono text-xs font-bold text-foreground">
                  3
                </span>
                <div>
                  <p className="font-sans font-semibold text-foreground text-sm">
                    Visual Integration
                  </p>
                  <p className="mt-0.5 leading-relaxed">
                    Completed screen-free breaks are permanently recorded on TODAY's timeline
                    and the glance bar with the distinct ░ pixel checkerboard pattern.
                  </p>
                </div>
              </div>
            </div>

            {/* Animation Selector */}
            <div className="mt-8 border-t border-border pt-6">
              <div className="flex items-center justify-between">
                <p className="font-sans text-xs font-semibold text-foreground">
                  Unlock Animation Style
                </p>
                <button
                  type="button"
                  onClick={triggerPreview}
                  disabled={isPlaying}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-secondary/80 px-2.5 py-1 font-sans text-xs font-medium text-foreground transition-colors hover:border-foreground/30 hover:bg-secondary"
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>{isPlaying ? "Playing..." : "Preview Reward"}</span>
                </button>
              </div>

              <div className="mt-3 grid grid-cols-3 gap-2">
                {(["Ticks", "Day sweep", "Fade"] as BreakAnimation[]).map((anim) => (
                  <button
                    key={anim}
                    type="button"
                    onClick={() => {
                      setSelectedAnimation(anim);
                      triggerPreview();
                    }}
                    className={`rounded-lg border px-3 py-2 text-center font-sans text-xs transition-all ${
                      selectedAnimation === anim
                        ? "border-foreground bg-foreground text-background font-semibold shadow-xs"
                        : "border-border bg-card text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                    }`}
                  >
                    {anim}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Simulated Unlock Reward Card */}
        <div className="flex flex-col lg:col-span-6">
          <div className="relative overflow-hidden rounded-2xl border border-neutral-800 bg-neutral-950 p-6 sm:p-8 text-white shadow-2xl">
            {/* Header info */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3 font-mono text-xs text-neutral-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Sparkles className="h-3.5 w-3.5" />
                SCREEN-FREE REWARD
              </span>
              <span>Zen Focus Service</span>
            </div>

            {/* The Reward Content with animation states */}
            <div className="my-8 flex flex-col items-center text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 ring-8 ring-emerald-500/10">
                <Moon className="h-6 w-6" />
              </div>

              <span className="mt-4 font-mono text-xs text-neutral-400">
                14:15 → 17:57
              </span>

              <h4 className="mt-1 font-sans text-3xl sm:text-4xl font-bold tracking-tight text-white">
                3h 42m Screen-Free
              </h4>

              <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 font-mono text-xs text-amber-300">
                <span>◆</span>
                <span>new longest break today</span>
              </div>

              {/* Growing Milestone Line */}
              <div className="mt-8 w-full">
                <div className="flex justify-between font-mono text-[10px] text-neutral-400 mb-1.5">
                  <span className="text-emerald-400">good break (1h)</span>
                  <span className="text-emerald-400 font-bold">long break (3h)</span>
                  <span>half a day (6h)</span>
                  <span>whole night (8h+)</span>
                </div>

                <div className="relative h-2 w-full rounded-full bg-neutral-800 overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-1000 ${
                      isPlaying ? "w-0 animate-[grow_2s_ease-out_forwards]" : "w-[62%]"
                    }`}
                    style={{ width: isPlaying ? "62%" : "62%" }}
                  />
                </div>
              </div>

              {/* Ticks simulation */}
              {selectedAnimation === "Ticks" && (
                <div className="mt-6 flex items-center justify-center gap-1.5">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <span
                      key={i}
                      className={`h-3 w-1 rounded-xs transition-colors duration-300 ${
                        i < 8
                          ? "bg-emerald-400 shadow-xs shadow-emerald-400/50"
                          : "bg-neutral-800"
                      }`}
                    />
                  ))}
                </div>
              )}

              {selectedAnimation === "Day sweep" && (
                <p className="mt-4 font-mono text-xs text-neutral-400 italic">
                  * Day sweep: a subtle radial daylight arc sweeps across the screen on wake
                </p>
              )}

              {selectedAnimation === "Fade" && (
                <p className="mt-4 font-mono text-xs text-neutral-400 italic">
                  * Fade: soft obsidian dissipation back to your quiet home screen
                </p>
              )}
            </div>

            {/* Bottom confirmation */}
            <div className="border-t border-neutral-800 pt-4 text-center">
              <p className="font-mono text-xs text-neutral-500">
                Dismisses automatically on touch · Recorded into local Room DB
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
