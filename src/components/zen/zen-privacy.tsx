import { Database, EyeOff, CloudOff } from "lucide-react";
import { ZenSection } from "./zen-section";

const STATEMENTS = [
  {
    icon: Database,
    title: "Everything lives on your device",
    desc: "Usage stats, tags, the age meter — all in a local database on your phone or PC.",
  },
  {
    icon: CloudOff,
    title: "Sync is opt-in and off by default",
    desc: "Nothing leaves the device until you sign in and turn on sync in Settings.",
  },
  {
    icon: EyeOff,
    title: "No analytics, no Zen account",
    desc: "No tracking SDK and nothing sent anywhere just to watch how you use the app.",
  },
];

const PERMISSIONS = [
  {
    name: "Usage access",
    badge: "Optional",
    body: "Powers today's timeline and screen-time totals by reading Android's standard usage stats — how long each app was in front, never what was on screen.",
  },
  {
    name: "Accessibility",
    badge: "Optional",
    body: "Powers the wait timer, blocks, grayscale and unlock rewards. Window-content reads happen in exactly two places: in Chrome, Zen reads the address bar and keeps only the domain, never the full URL; on YouTube, it checks view IDs — never text — to spot the Shorts player. Everywhere else it only sees which app is in front, never what you type or read.",
  },
  {
    name: "Notification access",
    badge: "Optional",
    body: "Routes distracting notifications into Zen's own quiet inbox, and reads YouTube's now-playing notification to time watch sessions. Saved notifications are capped at 200 and excluded from backups.",
  },
  {
    name: "Write secure settings",
    badge: "Optional · one-time (ADB)",
    body: "A single one-time adb command enables per-app grayscale. Skip it entirely if you don't use that feature.",
  },
];

export function ZenPrivacy() {
  return (
    <ZenSection
      id="privacy"
      eyebrow="Private by design"
      title="No analytics. Nothing leaves unless you say so."
      lede="Every permission below is optional, requested only when you turn on the feature that needs it — and each one does less than you'd guess."
      tone="surface"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {STATEMENTS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.title} className="rounded-xl border border-border bg-card p-5">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <h3 className="mt-3 font-sans text-sm font-semibold text-foreground">{s.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{s.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-8 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {PERMISSIONS.map((p) => (
          <details key={p.name} className="group px-6 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <span className="flex items-center gap-2.5">
                <span className="font-sans text-sm font-semibold text-foreground">{p.name}</span>
                <span className="rounded border border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
                  {p.badge}
                </span>
              </span>
              <span className="font-mono text-xs text-muted-foreground transition-transform group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
          </details>
        ))}
      </div>
    </ZenSection>
  );
}
