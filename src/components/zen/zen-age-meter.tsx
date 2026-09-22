"use client";

import { useEffect, useState, useMemo } from "react";
import { Clock, Sliders, Sparkles, RefreshCw, Compass, Shield } from "lucide-react";

type AgeMeterStyle =
  | "Orbit"
  | "Odometer"
  | "Months dot grid"
  | "Terminal"
  | "Three Horizons"
  | "Lifeline"
  | "Horizon Ticks";

const STYLES: { id: AgeMeterStyle; label: string; desc: string }[] = [
  {
    id: "Three Horizons",
    label: "Three Horizons",
    desc: "Clean stacked bars tracking your Life, Year, and Today synchronously.",
  },
  {
    id: "Odometer",
    label: "Odometer",
    desc: "Precision mechanical counter rolling your years forward in real-time.",
  },
  {
    id: "Months dot grid",
    label: "Months Dot Grid",
    desc: "A stoic matrix of every month in your expected lifespan horizon.",
  },
  {
    id: "Terminal",
    label: "Terminal",
    desc: "UNIX-style monospace console output with ASCII progress tracks.",
  },
  {
    id: "Orbit",
    label: "Orbit",
    desc: "Concentric circular arcs representing planetary cycles of time.",
  },
  {
    id: "Lifeline",
    label: "Lifeline",
    desc: "Minimal single-line horizon with a live breathing hour indicator.",
  },
  {
    id: "Horizon Ticks",
    label: "Horizon Ticks",
    desc: "Linear tick marks with a pulsing green current-hour fill.",
  },
];

export function ZenAgeMeter() {
  const [selectedStyle, setSelectedStyle] = useState<AgeMeterStyle>("Three Horizons");
  const [showYearsLeft, setShowYearsLeft] = useState(false);
  const [barHeight, setBarHeight] = useState(10); // 2 to 24 dp
  const [now, setNow] = useState<Date | null>(null);

  // Default birthdate for demo: 26.7 years ago
  const birthTime = useMemo(() => new Date(1999, 9, 21, 8, 30, 0).getTime(), []);
  const horizonYears = 80;

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => {
      setNow(new Date());
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const ageData = useMemo(() => {
    if (!now) {
      return {
        ageStr: "26.719482910",
        leftStr: "53.280517090",
        lifePct: 33.4,
        yearPct: 72.8,
        todayPassedHours: 13,
        todayPassedMins: 48,
        todayLeftHours: 10,
        todayLeftMins: 12,
        currentHourFrac: 0.8,
      };
    }

    const currentMs = now.getTime();
    const diffMs = currentMs - birthTime;
    const msPerYear = 365.2425 * 24 * 60 * 60 * 1000;
    const ageVal = diffMs / msPerYear;
    const leftVal = Math.max(0, horizonYears - ageVal);

    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1).getTime();
    const yearPct = ((currentMs - startOfYear) / (endOfYear - startOfYear)) * 100;

    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).getTime();
    const todayMs = currentMs - startOfDay;
    const passedHours = Math.floor(todayMs / (1000 * 60 * 60));
    const passedMins = Math.floor((todayMs % (1000 * 60 * 60)) / (1000 * 60));
    const leftHours = 23 - passedHours;
    const leftMins = 59 - passedMins;
    const currentHourFrac = (now.getMinutes() * 60 + now.getSeconds()) / 3600;

    return {
      ageStr: ageVal.toFixed(9),
      leftStr: leftVal.toFixed(9),
      lifePct: Math.min(100, (ageVal / horizonYears) * 100),
      yearPct,
      todayPassedHours: passedHours,
      todayPassedMins: passedMins,
      todayLeftHours: leftHours,
      todayLeftMins: leftMins,
      currentHourFrac,
    };
  }, [now, birthTime, horizonYears]);

  return (
    <section id="age-meter" className="mx-auto max-w-6xl px-6 py-20 md:py-28 border-t border-border">
      {/* Section Header */}
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-background font-mono text-[10px] font-bold">
            01
          </span>
          <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Memento Mori Engine
          </span>
        </div>
        <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Age Meter: A Calm Existential Clock
        </h2>
        <p className="max-w-3xl font-serif text-lg text-muted-foreground leading-relaxed">
          Inspired by Stoic Memento Mori philosophy, Zen Launcher places your finite
          lifespan directly on your home screen. Not to induce panic, but to invite
          mindful intentionality every time you unlock your phone.
        </p>
      </div>

      {/* Interactive Age Meter Playground */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Style Switcher & Controls */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="font-sans text-sm font-semibold tracking-tight text-foreground flex items-center justify-between">
              <span>7 Memento Mori Styles</span>
              <span className="font-mono text-[11px] text-muted-foreground">Pick a face</span>
            </h3>

            <div className="mt-4 flex flex-col gap-2">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  type="button"
                  className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                    selectedStyle === style.id
                      ? "border-foreground bg-foreground/5 shadow-xs"
                      : "border-border/60 bg-transparent hover:border-border hover:bg-secondary/40"
                  }`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span
                      className={`font-sans text-sm font-medium ${
                        selectedStyle === style.id ? "text-foreground font-semibold" : "text-muted-foreground"
                      }`}
                    >
                      {style.label}
                    </span>
                    {selectedStyle === style.id && (
                      <span className="font-mono text-[10px] rounded bg-foreground px-1.5 py-0.5 text-background font-medium">
                        Active
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground leading-snug">
                    {style.desc}
                  </p>
                </button>
              ))}
            </div>

            {/* Granular Slider: Bar Heights (2-24 dp) */}
            <div className="mt-6 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="bar-height-slider"
                  className="flex items-center gap-1.5 font-sans text-xs font-medium text-foreground"
                >
                  <Sliders className="h-3.5 w-3.5 text-muted-foreground" />
                  <span>Bar Height ({barHeight} dp)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setBarHeight(10)}
                  className="font-mono text-[11px] text-muted-foreground hover:text-foreground underline decoration-dotted"
                >
                  Reset (10 dp)
                </button>
              </div>
              <input
                id="bar-height-slider"
                type="range"
                min="2"
                max="24"
                value={barHeight}
                onChange={(e) => setBarHeight(Number(e.target.value))}
                className="mt-2.5 h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-secondary accent-foreground"
              />
              <p className="mt-1 text-[11px] text-muted-foreground">
                In Zen settings, every bar has a 2–24 dp slider with one-tap reset.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Simulated Screen Interface */}
        <div className="flex flex-col lg:col-span-7">
          <div className="relative flex flex-col justify-between overflow-hidden rounded-2xl border border-border bg-neutral-950 p-6 sm:p-8 text-white shadow-xl min-h-[460px]">
            {/* Header info bar */}
            <div className="flex items-center justify-between border-b border-neutral-800 pb-4 font-mono text-xs text-neutral-400">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-neutral-200">Header Mode: Clock + Age Meter</span>
              </div>
              <span className="rounded border border-neutral-800 bg-neutral-900 px-2 py-0.5 text-[11px] text-neutral-300">
                Horizon: {horizonYears}y
              </span>
            </div>

            {/* Live Age Display (Tap to switch) */}
            <div className="my-6">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-400">
                  {showYearsLeft ? "Years Remaining (Tap to flip)" : "Live Age to 9 Decimals (Tap to flip)"}
                </span>
                <span className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-[10px] text-neutral-300">
                  Interactive
                </span>
              </div>

              <button
                type="button"
                onClick={() => setShowYearsLeft(!showYearsLeft)}
                className="mt-2 text-left group cursor-pointer w-full"
              >
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white transition-colors group-hover:text-emerald-300">
                    {showYearsLeft ? ageData.leftStr : ageData.ageStr}
                  </span>
                  <span className="font-mono text-sm sm:text-base text-neutral-400">
                    {showYearsLeft ? "years left" : "years"}
                  </span>
                </div>
                <p className="mt-1 text-xs text-neutral-500 group-hover:text-neutral-300 transition-colors">
                  Tap to switch between live age and years remaining. Can also be switched off in Zen settings.
                </p>
              </button>
            </div>

            {/* Dynamic Rendering of the Chosen Style */}
            <div className="my-4 rounded-xl border border-neutral-800/80 bg-neutral-900/60 p-5 backdrop-blur-xs">
              {/* Style 1: Three Horizons (Life · Year · Today) */}
              {selectedStyle === "Three Horizons" && (
                <div className="flex flex-col gap-4">
                  {/* Life Bar */}
                  <div>
                    <div className="flex justify-between font-mono text-xs text-neutral-300">
                      <span>LIFE</span>
                      <span>{ageData.lifePct.toFixed(1)}% of {horizonYears}y</span>
                    </div>
                    <div
                      className="mt-1.5 w-full rounded-xs bg-neutral-800 overflow-hidden"
                      style={{ height: `${barHeight}px` }}
                    >
                      <div
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${ageData.lifePct}%` }}
                      />
                    </div>
                  </div>

                  {/* Year Bar */}
                  <div>
                    <div className="flex justify-between font-mono text-xs text-neutral-300">
                      <span>YEAR</span>
                      <span>{ageData.yearPct.toFixed(1)}%</span>
                    </div>
                    <div
                      className="mt-1.5 w-full rounded-xs bg-neutral-800 overflow-hidden"
                      style={{ height: `${barHeight}px` }}
                    >
                      <div
                        className="h-full bg-neutral-300 transition-all duration-300"
                        style={{ width: `${ageData.yearPct}%` }}
                      />
                    </div>
                  </div>

                  {/* Today Bar with breathing current hour tick */}
                  <div>
                    <div className="flex justify-between items-baseline font-mono text-xs text-neutral-300">
                      <div className="flex items-center gap-2">
                        <span>TODAY</span>
                        <span className="rounded bg-emerald-950 text-emerald-400 border border-emerald-800 px-1.5 py-0.2 text-[10px] font-sans font-medium">
                          1h 5m productive
                        </span>
                      </div>
                      <span className="text-[11px] text-neutral-400">
                        {ageData.todayPassedHours}h {ageData.todayPassedMins}m spent · {ageData.todayLeftHours}h left
                      </span>
                    </div>
                    <div
                      className="mt-1.5 flex w-full gap-0.5 rounded-xs overflow-hidden"
                      style={{ height: `${barHeight}px` }}
                    >
                      {Array.from({ length: 24 }).map((_, i) => {
                        const isPast = i < ageData.todayPassedHours;
                        const isCurrent = i === ageData.todayPassedHours;
                        return (
                          <div
                            key={i}
                            className={`flex-1 ${
                              isPast
                                ? "bg-white"
                                : isCurrent
                                ? "bg-emerald-400 animate-pulse"
                                : "bg-neutral-800"
                            }`}
                            title={`Hour ${i}:00`}
                          />
                        );
                      })}
                    </div>
                    <p className="mt-2 font-mono text-[11px] text-neutral-500">
                      * Current hour tick fills live and "breathes". TODAY counts hours spent, then hours left.
                    </p>
                  </div>
                </div>
              )}

              {/* Style 2: Odometer */}
              {selectedStyle === "Odometer" && (
                <div className="flex flex-col items-center justify-center py-6 text-center">
                  <p className="font-mono text-xs text-neutral-400 mb-2">PRECISION ODOMETER WHEELS</p>
                  <div className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-950 p-3 font-mono text-2xl sm:text-3xl font-bold tracking-widest text-emerald-400 shadow-inner">
                    {ageData.ageStr.split("").map((ch, idx) => (
                      <span
                        key={idx}
                        className={`inline-block rounded px-1 ${
                          ch === "." ? "text-neutral-500" : "bg-neutral-900 border border-neutral-800"
                        }`}
                      >
                        {ch}
                      </span>
                    ))}
                  </div>
                  <p className="mt-3 text-xs text-neutral-400 max-w-sm">
                    Replicating mechanical vehicle gauges, with steady digits continuously rolling up as every second passes.
                  </p>
                </div>
              )}

              {/* Style 3: Months Dot Grid */}
              {selectedStyle === "Months dot grid" && (
                <div>
                  <div className="flex justify-between font-mono text-xs text-neutral-400 mb-2">
                    <span>960 MONTHS (80 YEARS HORIZON)</span>
                    <span className="text-white">~320 Passed</span>
                  </div>
                  <div className="grid grid-cols-24 gap-1 sm:gap-1.5 py-2 max-h-36 overflow-hidden">
                    {Array.from({ length: 192 }).map((_, i) => {
                      const isFilled = i < 64;
                      return (
                        <span
                          key={i}
                          className={`h-1.5 w-1.5 rounded-full ${
                            isFilled ? "bg-white" : "bg-neutral-800"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <p className="mt-2 text-xs text-neutral-500 font-mono">
                    Showing sample 16-year segment. Each row represents 2 years (24 months) of your lifetime.
                  </p>
                </div>
              )}

              {/* Style 4: Terminal */}
              {selectedStyle === "Terminal" && (
                <div className="font-mono text-xs text-emerald-400 space-y-1.5">
                  <p className="text-neutral-400">$ zen-meter --lifespan={horizonYears} --status</p>
                  <p>[OK] Birth epoch: 1999-10-21 08:30:00</p>
                  <p>[LIFE]  [################----] 33.4% ({ageData.ageStr}y / {horizonYears}y)</p>
                  <p>[YEAR]  [###############-----] 72.8% (Day 265 / 365)</p>
                  <p>[TODAY] [#############-------] {ageData.todayPassedHours}h spent | {ageData.todayLeftHours}h remaining</p>
                  <p className="text-neutral-500">_ cursor blinking (1h 5m productive time logged)</p>
                </div>
              )}

              {/* Style 5: Orbit */}
              {selectedStyle === "Orbit" && (
                <div className="flex items-center justify-center py-4">
                  <div className="relative flex h-36 w-36 items-center justify-center rounded-full border border-neutral-700">
                    {/* Life Orbit */}
                    <div
                      className="absolute inset-2 rounded-full border-2 border-dashed border-white/60"
                      style={{ transform: `rotate(${ageData.lifePct * 3.6}deg)` }}
                    />
                    {/* Year Orbit */}
                    <div
                      className="absolute inset-5 rounded-full border-2 border-emerald-400/80"
                      style={{ transform: `rotate(${ageData.yearPct * 3.6}deg)` }}
                    />
                    {/* Today Orbit */}
                    <div
                      className="absolute inset-8 rounded-full border-2 border-neutral-500"
                      style={{ transform: `rotate(${(ageData.todayPassedHours / 24) * 360}deg)` }}
                    />
                    <div className="text-center font-mono text-[11px] text-neutral-300">
                      <span className="font-bold text-white">ORBIT</span>
                      <br />
                      <span>{ageData.lifePct.toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Style 6: Lifeline */}
              {selectedStyle === "Lifeline" && (
                <div className="py-6">
                  <div className="relative flex items-center">
                    <div className="h-0.5 w-full bg-neutral-800" />
                    <div
                      className="absolute h-1 bg-white"
                      style={{ width: `${ageData.lifePct}%` }}
                    />
                    <div
                      className="absolute h-3 w-3 rounded-full bg-emerald-400 shadow-md ring-4 ring-emerald-950 animate-pulse"
                      style={{ left: `${ageData.lifePct}%`, transform: "translateX(-50%)" }}
                    />
                  </div>
                  <div className="mt-4 flex justify-between font-mono text-xs text-neutral-400">
                    <span>Birth: 0.00y</span>
                    <span className="text-emerald-400 font-bold">Now: {ageData.ageStr}y</span>
                    <span>Horizon: {horizonYears}y</span>
                  </div>
                </div>
              )}

              {/* Style 7: Horizon Ticks */}
              {selectedStyle === "Horizon Ticks" && (
                <div className="py-4">
                  <div className="flex justify-between font-mono text-xs text-neutral-400 mb-2">
                    <span>DECADE HORIZON TICKS</span>
                    <span>{horizonYears} Years</span>
                  </div>
                  <div className="flex items-end gap-1 h-12 border-b border-neutral-700">
                    {Array.from({ length: 40 }).map((_, i) => {
                      const isMajor = i % 5 === 0;
                      const isFilled = i < 14;
                      return (
                        <div
                          key={i}
                          className={`flex-1 ${
                            isFilled ? "bg-white" : "bg-neutral-800"
                          } ${isMajor ? "h-10" : "h-5"}`}
                        />
                      );
                    })}
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-neutral-500">
                    Linear tick frequency with major decade delimiters and live hour breathing pulse.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom summary bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-neutral-800 pt-3 text-[11px] text-neutral-400 font-mono">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-white" />
                Tap header to cycle: Clock ↔ Age Meter ↔ Stacked
              </span>
              <span>Presets: 70 – 100 Years</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
