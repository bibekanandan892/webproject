"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ZenSection } from "./zen-section";
import { DeviceFrame } from "./device-frame";
import { ZenPicture } from "./zen-picture";
import { ZEN_TAGS } from "./zen-tags";
import { useZenLightbox } from "./zen-lightbox";

interface HourDetail {
  hour: number;
  timeLabel: string;
  learn: number;
  productive: number;
  fun: number;
  waste: number;
  offPhone: number;
}

const SAMPLE_HOURS: HourDetail[] = [
  { hour: 9, timeLabel: "09:00–10:00", learn: 0, productive: 45, fun: 5, waste: 0, offPhone: 10 },
  { hour: 12, timeLabel: "12:00–13:00", learn: 0, productive: 0, fun: 0, waste: 0, offPhone: 60 },
  { hour: 14, timeLabel: "14:00–15:00", learn: 30, productive: 8, fun: 12, waste: 0, offPhone: 10 },
  { hour: 16, timeLabel: "16:00–17:00", learn: 15, productive: 0, fun: 20, waste: 20, offPhone: 5 },
];

const TAG_VAR: Record<string, string> = {
  learn: "var(--zen-learn)",
  productive: "var(--zen-productive)",
  fun: "var(--zen-fun)",
  waste: "var(--zen-waste)",
};

export function ZenSee() {
  const { open } = useZenLightbox();
  const [activeIndex, setActiveIndex] = useState(2);
  const hour = SAMPLE_HOURS[activeIndex];
  const total = hour.learn + hour.productive + hour.fun + hour.waste + hour.offPhone;

  return (
    <ZenSection
      id="see"
      aliasIds={["timeline"]}
      eyebrow="See your day"
      title="What the colours mean"
      lede="Every app, site and video sorts into one of four tags — plus screen-free, for the time you're not looking at a screen at all."
    >
      {/* Legend — the one canonical colour key on the page */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {ZEN_TAGS.map((tag) => (
          <div key={tag.id} className="flex flex-col rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-2.5">
              <span
                className="h-3.5 w-3.5 shrink-0 rounded-full"
                style={{ backgroundColor: tag.hex }}
              />
              <h3 className="font-sans text-sm font-semibold text-foreground">{tag.label}</h3>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              {tag.examples.join(" · ")}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2.5 text-xs text-muted-foreground">
        <span className="zen-free-swatch h-3.5 w-3.5 shrink-0 rounded-xs border border-border" />
        <span>
          <span className="font-medium text-foreground">Screen-free</span> — an hour or more away
          from the screen, phone off or locked.
        </span>
      </div>

      {/* Interactive timeline, restyled into the shared device surface */}
      <div className="mt-10">
        <DeviceFrame variant="window" label="Zen — Today's timeline">
          <div className="p-6 text-white sm:p-8">
            <div className="flex items-center justify-between font-mono text-xs text-neutral-400">
              <span className="font-semibold text-white">Tap an hour to inspect it</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveIndex((i) => (i > 0 ? i - 1 : SAMPLE_HOURS.length - 1))}
                  aria-label="Previous hour"
                  className="flex h-7 w-7 items-center justify-center rounded border border-neutral-700 hover:bg-neutral-800"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="w-24 text-center text-white">{hour.timeLabel}</span>
                <button
                  type="button"
                  onClick={() => setActiveIndex((i) => (i < SAMPLE_HOURS.length - 1 ? i + 1 : 0))}
                  aria-label="Next hour"
                  className="flex h-7 w-7 items-center justify-center rounded border border-neutral-700 hover:bg-neutral-800"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {SAMPLE_HOURS.map((h, i) => (
                <button
                  key={h.hour}
                  type="button"
                  onClick={() => setActiveIndex(i)}
                  className={`rounded border px-2.5 py-1 font-mono text-xs transition-colors ${
                    i === activeIndex
                      ? "border-white bg-white/10 font-semibold text-white"
                      : "border-neutral-800 text-neutral-400 hover:border-neutral-700 hover:text-white"
                  }`}
                >
                  {h.timeLabel}
                </button>
              ))}
            </div>

            <div className="mt-5 flex h-6 w-full overflow-hidden rounded-md border border-neutral-800">
              {(["learn", "productive", "fun", "waste"] as const).map((key) =>
                hour[key] > 0 ? (
                  <div
                    key={key}
                    style={{ width: `${(hour[key] / total) * 100}%`, background: TAG_VAR[key] }}
                    title={`${hour[key]}m ${key}`}
                  />
                ) : null
              )}
              {hour.offPhone > 0 && (
                <div
                  className="zen-free-swatch h-full"
                  style={{ width: `${(hour.offPhone / total) * 100}%` }}
                  title={`${hour.offPhone}m screen-free`}
                />
              )}
            </div>
            <p className="mt-2 font-mono text-[11px] text-neutral-500">
              {60 - hour.offPhone}m on the phone · {hour.offPhone}m screen-free
            </p>
          </div>
        </DeviceFrame>
      </div>

      {/* Windows: a lane per display */}
      <div className="mt-10 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
        <div className="lg:col-span-5">
          <h3 className="font-sans text-base font-semibold text-foreground">On Windows, a lane per display</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Every display you used today gets its own lane, plus a merged Attention lane. Unplug a
            monitor and its lane stays — history never disappears.
          </p>
        </div>
        <div className="lg:col-span-7">
          <ZenPicture
            src="windows/timeline.png"
            alt="Zen Desktop timeline with an Attention lane and one lane per display, including a disconnected display"
            className="overflow-hidden rounded-xl border border-border"
            onClick={() => open("windows/timeline.png")}
          />
        </div>
      </div>

      {/* All-devices, one sentence + one image */}
      <div className="mt-8 flex flex-col items-start gap-4 rounded-xl border border-border bg-card p-5 sm:flex-row sm:items-center">
        <div className="w-full shrink-0 sm:w-48">
          <ZenPicture
            src="windows/all-devices.png"
            alt="Zen All Devices view merging phone and PC into one day"
            className="overflow-hidden rounded-lg border border-border"
            onClick={() => open("windows/all-devices.png")}
          />
        </div>
        <p className="text-sm text-muted-foreground">
          Turn on sync and your phone and your PC become one timeline instead of two —{" "}
          <a href="#desktop" className="text-[color:var(--accent-strong)] underline decoration-dotted underline-offset-4 hover:decoration-solid">
            see Zen on your PC
          </a>
          .
        </p>
      </div>
    </ZenSection>
  );
}
