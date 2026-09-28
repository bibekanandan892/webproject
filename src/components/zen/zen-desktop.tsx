import { PictureInPicture2, Puzzle, Brain, Wand2, Smartphone, Laptop, Cloud } from "lucide-react";
import { ZenSection } from "./zen-section";
import { DeviceFrame } from "./device-frame";
import { ZenPicture } from "./zen-picture";
import { ZenLightboxImage } from "./zen-lightbox";

const FEATURES = [
  {
    icon: PictureInPicture2,
    title: "Floating widget",
    desc: "An always-on-top card with today's totals. Draggable, click-through, toggled with Ctrl+Alt+Z.",
    shot: "windows/widget.png",
  },
  {
    icon: Puzzle,
    title: "Browser extension",
    desc: "Adds site-level tracking for Chrome, Edge and Brave, reported straight to the desktop app.",
    shot: "windows/tags.png",
  },
  {
    icon: Brain,
    title: "On-device AI tagging",
    desc: "A built-in Qwen2.5 1.5B model (about 1.1 GB) tags new apps and sites — or point it at your own Ollama.",
    shot: "windows/setup-ai.png",
  },
  {
    icon: Wand2,
    title: "Setup wizard",
    desc: "One guided pass on first run for tracking, tagging, AI and sync. The browser extension takes one manual step: Developer mode, then Load unpacked.",
    shot: "windows/setup-welcome.png",
  },
];

export function ZenDesktop() {
  return (
    <ZenSection
      id="desktop"
      aliasIds={["sync"]}
      eyebrow="Zen on your PC"
      title="The same idea, on the machine you work at"
      lede="Zen Desktop watches which window has your attention, tags it, and keeps a timeline of the day — with a widget, a browser extension, and on-device AI that can tag for you."
    >
      <DeviceFrame variant="window" label="Zen Desktop — Dashboard">
        <ZenLightboxImage
          src="windows/dashboard.png"
          alt="Zen Desktop dashboard: age meter, today's usage by state, per-display timeline and top apps"
        />
      </DeviceFrame>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURES.map((f) => {
          const Icon = f.icon;
          return (
            <div key={f.title} className="flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
              <ZenLightboxImage src={f.shot} alt={f.title} aspectClassName="aspect-[4/3]" />
              <div className="flex flex-1 flex-col p-5">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background">
                  <Icon className="h-4 w-4" />
                </span>
                <h3 className="mt-3 font-sans text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{f.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Sub-block: phone + PC, one day */}
      <div className="mt-12 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h3 className="font-sans text-base font-semibold text-foreground">Phone + PC, one day</h3>
        <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6">
            <ZenPicture
              src="windows/all-devices.png"
              alt="Zen All Devices view with Learn, Productive, Fun, Waste and screen-free totals across phone and PC"
              className="overflow-hidden rounded-xl border border-border"
            />
          </div>
          <div className="lg:col-span-6">
            <p className="text-sm leading-relaxed text-muted-foreground">
              Turn on sync and Zen writes to a hidden, app-only folder in your own Google Drive —
              never a server either of us runs. It&apos;s opt-in and off until you turn it on, and
              it supports one phone and one PC per account.
            </p>
            <div className="mt-5 flex items-center justify-center gap-5">
              <div className="flex flex-col items-center gap-1.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary/60">
                  <Smartphone className="h-4.5 w-4.5 text-foreground" />
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">1 phone</span>
              </div>
              <Cloud className="h-5 w-5 text-muted-foreground" />
              <div className="flex flex-col items-center gap-1.5">
                <span className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-secondary/60">
                  <Laptop className="h-4.5 w-4.5 text-foreground" />
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">1 PC</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="mt-8 font-mono text-[11px] text-muted-foreground">
        .NET 8 · WPF · local SQLite database · Windows 10 (1809+) and Windows 11, 64-bit
      </p>
    </ZenSection>
  );
}
