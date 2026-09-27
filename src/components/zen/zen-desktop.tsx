"use client";

import { Monitor, Puzzle, Brain, Wand2, PictureInPicture2, Cpu } from "lucide-react";

const TRACKING_STATES = [
  {
    name: "Active",
    dot: "bg-emerald-500",
    desc: "Recent keyboard or mouse input in the focused window. Counts as usage.",
  },
  {
    name: "Likely active",
    dot: "bg-emerald-500/50",
    desc: "No input, but strong evidence you're still there — reading, watching a video, in a meeting. Counts as usage, shown lighter on the timeline.",
  },
  {
    name: "Idle",
    dot: "bg-neutral-500",
    desc: "You're at the desktop, but nothing suggests you're paying attention. Doesn't count.",
  },
  {
    name: "Inactive",
    dot: "bg-neutral-700",
    desc: "Locked, asleep, display off, or logged off. Doesn't count.",
  },
];

const TAGS = [
  { name: "Learn", hex: "#5DCAA5" },
  { name: "Productive", hex: "#AFA9EC" },
  { name: "Fun", hex: "#EF9F27" },
  { name: "Waste", hex: "#E24B4A" },
];

const WIZARD_STEPS = [
  "Welcome",
  "How tracking works",
  "What the colours mean",
  "Reading the timeline",
  "Privacy — full URLs or domains only, widget titles on or off",
  "Browser extension — connects and confirms it's working",
  "AI tagging — built-in model, Ollama, or skip",
  "Phone sync — optional, sign in or skip",
  "Your preferences — birth date, autostart, widget, reminders",
];

export function ZenDesktop() {
  return (
    <section id="desktop" className="mx-auto max-w-6xl px-6 py-20 md:py-28 border-t border-border">
      {/* Section Header */}
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-background font-mono text-[10px] font-bold">
            06
          </span>
          <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            The Desktop Companion
          </span>
        </div>
        <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Zen for Windows
        </h2>
        <p className="max-w-3xl font-serif text-lg text-muted-foreground leading-relaxed">
          The same idea, on the machine you actually work at. Zen Desktop watches which
          window has your attention, tags it Learn, Productive, Fun, or Waste, and keeps
          a per-display timeline of the day — with a floating widget, a browser extension
          for site-level tracking, and an on-device AI that can do the tagging for you.
        </p>
      </div>

      {/* Tracking states */}
      <div className="mt-12">
        <h3 className="font-sans text-lg font-bold text-foreground mb-1">
          Four tracking states
        </h3>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Every moment of the day resolves to one of four states, built from the
          foreground window, your input (counted, never recorded), media playback, and
          the lock state.
        </p>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TRACKING_STATES.map((s) => (
            <div key={s.name} className="rounded-xl border border-border bg-card p-5">
              <div className="flex items-center gap-2.5">
                <span className={`h-3 w-3 rounded-full ${s.dot}`} />
                <h4 className="font-sans text-sm font-semibold text-foreground">{s.name}</h4>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Tags + timeline lanes */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h3 className="font-sans text-lg font-bold text-foreground mb-1">
            Same four tags as the phone
          </h3>
          <p className="text-sm text-muted-foreground">
            Tag any app, site, or channel once — Zen remembers it.
          </p>
          <div className="mt-4 flex flex-col gap-2.5">
            {TAGS.map((t) => (
              <div
                key={t.name}
                className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5"
              >
                <span
                  className="h-3.5 w-3.5 rounded-full"
                  style={{ backgroundColor: t.hex }}
                />
                <span className="font-sans text-sm font-medium text-foreground">{t.name}</span>
                <span className="ml-auto font-mono text-[11px] text-muted-foreground">{t.hex}</span>
              </div>
            ))}
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-2.5">
              <span
                className="h-3.5 w-3.5 rounded-xs border border-neutral-400"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(45deg, #888 0, #888 1px, transparent 0, transparent 50%)",
                  backgroundSize: "4px 4px",
                }}
              />
              <span className="font-sans text-sm font-medium text-foreground">Screen-free</span>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <h3 className="font-sans text-lg font-bold text-foreground mb-1 flex items-center gap-2">
            <Monitor className="h-4 w-4 text-muted-foreground" />
            A lane per display
          </h3>
          <p className="text-sm text-muted-foreground max-w-xl">
            Every display you used today gets its own lane on the timeline. Unplug a
            monitor and its lane stays, labelled <span className="font-mono text-xs">(disconnected)</span> —
            history never disappears. An Attention lane merges every display into one
            view, and once a phone is synced, a Phone lane joins in too.
          </p>

          <div className="mt-5 rounded-xl border border-neutral-800 bg-neutral-950 p-5 text-white shadow-sm">
            <div className="flex flex-col gap-2 font-mono text-[11px]">
              {[
                { label: "Attention", w: [30, 8, 18, 10, 34] },
                { label: "Display 1", w: [30, 8, 18, 10, 34] },
                { label: "Display 2 (disconnected)", w: [55, 45] },
                { label: "Phone", w: [15, 20, 65] },
              ].map((lane, i) => (
                <div key={lane.label} className="flex items-center gap-3">
                  <span className="w-40 shrink-0 text-neutral-400">{lane.label}</span>
                  <div className="flex h-4 flex-1 overflow-hidden rounded-sm border border-neutral-800">
                    {lane.w.map((w, j) => (
                      <div
                        key={j}
                        className="h-full"
                        style={{
                          width: `${w}%`,
                          background:
                            j % 3 === 0
                              ? TAGS[0].hex
                              : j % 3 === 1
                              ? TAGS[1].hex
                              : "repeating-linear-gradient(45deg,#333 0,#333 1.5px,transparent 0,transparent 4px)",
                          opacity: i === 2 ? 0.55 : 1,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 font-mono text-[10px] text-neutral-500">
              Scroll to zoom, drag to pan, hover any span for details.
            </p>
          </div>
        </div>
      </div>

      {/* Widget, extension, AI — three cards */}
      <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
            <PictureInPicture2 className="h-4 w-4" />
          </span>
          <h3 className="mt-4 font-sans text-base font-bold text-foreground">
            Floating widget
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            An always-on-top card showing what&apos;s tracking right now and today&apos;s totals.
            Draggable, resizable to a compact mode, click-through when you don&apos;t want it
            in the way, and toggled anytime with <span className="font-mono">Ctrl+Alt+Z</span>.
            It never takes keyboard focus and records no time itself.
          </p>
        </div>

        <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
            <Puzzle className="h-4 w-4" />
          </span>
          <h3 className="mt-4 font-sans text-base font-bold text-foreground">
            Browser extension
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            Adds site-level tracking for Chrome, Edge, and Brave — which tab has focus,
            whether media is playing — reported straight to the desktop app on your own
            machine, never to a server. It isn&apos;t in a web store yet, so the setup wizard
            walks you through loading it unpacked (developer mode) in one pass.
          </p>
        </div>

        <div className="flex flex-col rounded-2xl border border-border bg-card p-6">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground text-background">
            <Brain className="h-4 w-4" />
          </span>
          <h3 className="mt-4 font-sans text-base font-bold text-foreground">
            On-device AI tagging
          </h3>
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            A built-in <span className="font-medium text-foreground">Qwen2.5 1.5B</span> model
            (~1.1 GB, downloaded once) tags new apps and sites for you, entirely on your
            PC. Already running Ollama? Zen can use that instead. Both are optional —
            skip AI tagging and do it by hand if you&apos;d rather.
          </p>
        </div>
      </div>

      {/* Setup wizard */}
      <div className="mt-14 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h3 className="font-sans text-lg font-bold text-foreground flex items-center gap-2">
          <Wand2 className="h-4 w-4 text-muted-foreground" />
          One setup wizard, everything configured
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          The installer opens a short guided setup the first time Zen Desktop runs. By
          the end, tracking, tagging, the extension, and sync are all decided —
          nothing is left half-configured.
        </p>
        <ol className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {WIZARD_STEPS.map((step, i) => (
            <li
              key={step}
              className="flex items-start gap-3 rounded-lg border border-border/70 bg-secondary/30 px-3.5 py-2.5 text-xs"
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-foreground text-background font-mono text-[10px] font-bold">
                {i + 1}
              </span>
              <span className="text-foreground/90 leading-snug">{step}</span>
            </li>
          ))}
        </ol>
      </div>

      {/* Tech footnote */}
      <p className="mt-8 flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
        <Cpu className="h-3.5 w-3.5" />
        .NET 8 · WPF · local SQLite database · Windows 10 (1809+) and Windows 11, x64
      </p>
    </section>
  );
}
