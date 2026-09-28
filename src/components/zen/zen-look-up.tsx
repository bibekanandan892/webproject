"use client";

import { useEffect, useMemo, useState } from "react";
import { ZenSection } from "./zen-section";
import { DeviceFrame } from "./device-frame";
import { ZenPicture } from "./zen-picture";
import { useZenLightbox } from "./zen-lightbox";

type AgeMeterStyle = "Three Horizons" | "Odometer" | "Terminal" | "Orbit";

const STYLES: { id: AgeMeterStyle; desc: string }[] = [
  { id: "Three Horizons", desc: "Stacked bars for Life, Year and Today." },
  { id: "Odometer", desc: "A rolling mechanical counter." },
  { id: "Terminal", desc: "Plain monospace status lines." },
  { id: "Orbit", desc: "Concentric arcs, one per horizon." },
];

export function ZenLookUp() {
  const { open } = useZenLightbox();
  const [style, setStyle] = useState<AgeMeterStyle>("Three Horizons");
  const [now, setNow] = useState<Date | null>(null);
  const birthTime = useMemo(() => new Date(1999, 9, 21, 8, 30, 0).getTime(), []);
  const horizonYears = 80;

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 200);
    return () => clearInterval(interval);
  }, []);

  const ageData = useMemo(() => {
    if (!now) return { ageStr: "26.719482910", lifePct: 33.4, yearPct: 72.8 };
    const diffMs = now.getTime() - birthTime;
    const msPerYear = 365.2425 * 24 * 60 * 60 * 1000;
    const ageVal = diffMs / msPerYear;
    const startOfYear = new Date(now.getFullYear(), 0, 1).getTime();
    const endOfYear = new Date(now.getFullYear() + 1, 0, 1).getTime();
    return {
      ageStr: ageVal.toFixed(9),
      lifePct: Math.min(100, (ageVal / horizonYears) * 100),
      yearPct: ((now.getTime() - startOfYear) / (endOfYear - startOfYear)) * 100,
    };
  }, [now, birthTime, horizonYears]);

  return (
    <ZenSection
      id="look-up"
      aliasIds={["age-meter", "breaks"]}
      eyebrow="A reason to look up"
      title="A quiet nudge, not a nag"
      lede="A live age meter keeps your finite time in view. Put the phone down for an hour and Zen notices — with a quiet reward, not a guilt trip."
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h3 className="font-sans text-sm font-semibold text-foreground">Pick a face</h3>
          <div className="mt-3 flex flex-col gap-2">
            {STYLES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setStyle(s.id)}
                className={`flex flex-col items-start rounded-lg border p-3 text-left transition-all ${
                  style === s.id
                    ? "border-foreground bg-foreground/5"
                    : "border-border/60 hover:border-border hover:bg-secondary/40"
                }`}
              >
                <span className={`font-sans text-sm ${style === s.id ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                  {s.id}
                </span>
                <span className="mt-0.5 text-xs text-muted-foreground">{s.desc}</span>
              </button>
            ))}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">
            7 styles ship in Zen; these 4 give the idea. Also rides along in Zen Desktop&apos;s widget.
          </p>
        </div>

        <div className="lg:col-span-7">
          <DeviceFrame variant="window" label="Age meter">
            <div className="p-6 text-white sm:p-8">
              {style === "Three Horizons" && (
                <div className="flex flex-col gap-4">
                  <Bar label="LIFE" pct={ageData.lifePct} sub={`${ageData.lifePct.toFixed(1)}% of ${horizonYears}y`} />
                  <Bar label="YEAR" pct={ageData.yearPct} sub={`${ageData.yearPct.toFixed(1)}%`} />
                </div>
              )}
              {style === "Odometer" && (
                <div className="flex items-center gap-1 rounded-lg border border-neutral-700 bg-neutral-950 p-3 font-mono text-2xl font-bold tracking-widest text-white">
                  {ageData.ageStr}
                </div>
              )}
              {style === "Terminal" && (
                <div className="font-mono text-xs text-neutral-300 space-y-1.5">
                  <p className="text-neutral-500">$ zen-meter --lifespan={horizonYears} --status</p>
                  <p>[LIFE] {ageData.lifePct.toFixed(1)}% of {horizonYears}y</p>
                  <p>[YEAR] {ageData.yearPct.toFixed(1)}%</p>
                </div>
              )}
              {style === "Orbit" && (
                <div className="flex items-center justify-center py-4">
                  <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-neutral-700">
                    <div
                      className="absolute inset-2 rounded-full border-2 border-dashed border-white/60"
                      style={{ transform: `rotate(${ageData.lifePct * 3.6}deg)` }}
                    />
                    <span className="font-mono text-xs text-neutral-300">{ageData.lifePct.toFixed(0)}%</span>
                  </div>
                </div>
              )}
              <p className="mt-6 border-t border-neutral-800 pt-3 font-mono text-[11px] text-neutral-500">
                Years remaining, bar height and horizon are all adjustable in Zen&apos;s settings.
              </p>
            </div>
          </DeviceFrame>
        </div>
      </div>

      {/* Screen-free reward — the real screenshot, not a mockup */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <ZenPicture
            src="android/screen-free.png"
            alt="Zen Android screen-free reward after a two hour break"
            className="mx-auto max-w-[220px] overflow-hidden rounded-[28px] border border-border shadow-sm"
            onClick={() => open("android/screen-free.png")}
          />
        </div>
        <div className="lg:col-span-7">
          <h3 className="font-sans text-base font-semibold text-foreground">Screen-free breaks</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            An hour or more with the screen locked or off counts as a break — a quick glance at a
            notification doesn&apos;t reset it. Come back, and Zen greets you with how long you were
            away instead of another badge to clear.
          </p>
        </div>
      </div>
    </ZenSection>
  );
}

function Bar({ label, pct, sub }: { label: string; pct: number; sub: string }) {
  return (
    <div>
      <div className="flex justify-between font-mono text-xs text-neutral-300">
        <span>{label}</span>
        <span>{sub}</span>
      </div>
      <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-xs bg-neutral-800">
        <div className="h-full bg-white transition-all duration-300" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
