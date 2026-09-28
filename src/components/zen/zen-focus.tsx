import { CheckCircle2, XCircle } from "lucide-react";
import { ZenSection } from "./zen-section";
import { ZenLightboxImage } from "./zen-lightbox";

const FOCUS_TOOLS = [
  { label: "Wait timer", desc: "A short pause before an app opens, to break the muscle-memory reach for it." },
  { label: "Block & schedules", desc: "Lock an app out for a set time, or on a recurring schedule — can't be skipped." },
  { label: "Grayscale", desc: "Drains the colour from one app while you're in it, everywhere else stays normal." },
  { label: "Time reminder", desc: "Pick a session length; when it's up, choose Exit or Extend." },
  { label: "Shorts isolation", desc: "YouTube Shorts get tagged Waste separately from long-form video." },
  { label: "Quiet inbox", desc: "Distracting notifications land in Zen's own inbox instead of your status bar." },
];

interface ModeRow {
  label: string;
  launcher: boolean | string;
  app: boolean | string;
}

const MODE_ROWS: ModeRow[] = [
  { label: "Home screen replaces app browsing", launcher: true, app: false },
  { label: "Today's timeline & tagging", launcher: true, app: true },
  { label: "Wait timer, blocks & schedules", launcher: true, app: true },
  { label: "Runs next to your current launcher", launcher: false, app: true },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true)
    return (
      <span className="inline-flex items-center gap-1.5 text-[color:var(--zen-learn-ink)]">
        <CheckCircle2 className="h-3.5 w-3.5" /> Yes
      </span>
    );
  if (value === false)
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <XCircle className="h-3.5 w-3.5" /> No
      </span>
    );
  return <span className="text-foreground">{value}</span>;
}

export function ZenFocus() {
  return (
    <ZenSection
      id="focus"
      aliasIds={["modes", "features"]}
      eyebrow="Slow down the pull"
      title="Make the impulsive opens harder"
      lede="Long-press any app for friction, not a warning — a pause, a block, or a colour drain, depending on what you set."
      tone="surface"
    >
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12">
        <div className="order-2 lg:order-1 lg:col-span-7">
          <ul className="flex flex-col gap-3">
            {FOCUS_TOOLS.map((tool) => (
              <li key={tool.label} className="flex flex-col gap-0.5 border-b border-border/70 pb-3 last:border-0">
                <span className="font-sans text-sm font-semibold text-foreground">{tool.label}</span>
                <span className="text-xs leading-relaxed text-muted-foreground">{tool.desc}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="order-1 lg:order-2 lg:col-span-5">
          <ZenLightboxImage
            src="android/focus.png"
            alt="Zen Android long-press menu with wait timer, block, time reminder, tags and grayscale options"
            className="mx-auto max-w-[220px] overflow-hidden rounded-[28px] border border-border shadow-sm"
          />
        </div>
      </div>

      {/* Launcher vs app mode — two cards, stacked on phone */}
      <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
        {(["launcher", "app"] as const).map((mode) => (
          <div key={mode} className="rounded-2xl border border-border bg-card p-5">
            <h3 className="font-sans text-base font-semibold text-foreground">
              {mode === "launcher" ? "Launcher mode" : "App mode"}
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              {mode === "launcher"
                ? "Zen replaces your home screen."
                : "Zen runs alongside your current launcher."}
            </p>
            <ul className="mt-4 flex flex-col gap-2.5">
              {MODE_ROWS.map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-3 text-xs">
                  <span className="text-muted-foreground">{row.label}</span>
                  <Cell value={row[mode]} />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h3 className="font-sans text-sm font-semibold text-foreground">
          Recommended: set Zen as your home screen
        </h3>
        <ol className="mt-3 flex flex-col gap-1.5 text-sm text-foreground">
          <li>1. Open Zen → Settings and turn on &quot;Set as home screen&quot;.</li>
          <li>
            2. Or from Android directly:{" "}
            <span className="font-mono text-xs">Settings → Apps → Default apps → Home app</span> →
            choose Zen.
          </li>
          <li className="text-muted-foreground">3. Changed your mind? Flip the same switch off.</li>
        </ol>
      </div>
    </ZenSection>
  );
}
