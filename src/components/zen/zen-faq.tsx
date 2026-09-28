import { ChevronDown } from "lucide-react";
import { ZenSection } from "./zen-section";
import type { ZenRelease } from "@/lib/zen-release";

const FAQS = [
  {
    q: "Is Zen free?",
    a: "Yes — free to download and use, no ads, no in-app purchases. A smaller build without on-device AI tagging is also available.",
  },
  {
    q: "Does any of my data leave my device?",
    a: "By default, no. Everything lives in a local database on your phone or PC. Data only leaves if you turn on Drive sync — and even then it goes to a hidden folder in your own Google Drive, never a server either of us runs.",
  },
  {
    q: "Why does Android call Zen an \"unknown developer\"?",
    a: "It just means the app isn't distributed through the Play Store — Zen needs permissions the Play Store's policies don't allow for this kind of app, so it's a direct APK download instead. That warning is expected for any sideloaded app.",
  },
  {
    q: "Does Zen work if I don't set it as my home screen?",
    a: "Yes. In app mode it runs alongside your current launcher and still tracks, tags, and shows the age meter — you just skip the extra friction of Zen's home screen replacing your app grid.",
  },
  {
    q: "I have an iPhone or a Mac — can I use Zen?",
    a: "Not yet. Zen is Android and Windows only today, with no timeline for iOS or macOS.",
  },
  {
    q: "How do I update Zen?",
    a: "Android: install the latest Zen.apk over the existing app. Windows: run the latest ZenDesktopSetup.exe — it upgrades your install in place.",
  },
];

const CURIOUS_ROWS = (release: ZenRelease) => [
  { label: "Android package", value: "com.bibek.zen" },
  { label: "OS support", value: "Android 8.0+ (API 26+), 64-bit only" },
  { label: "Android stack", value: "Kotlin · Jetpack Compose (Material 3) · Room SQLite" },
  { label: "Android on-device AI", value: "Gemma 3 1B via MediaPipe (~555 MB, downloaded once)" },
  { label: "Windows stack", value: "Windows 10 (1809+) / 11 · .NET 8 · WPF · local SQLite" },
  { label: "Windows on-device AI", value: "Qwen2.5 1.5B (~1.1 GB), or your own Ollama" },
  { label: "Sync transport", value: "Google Drive appDataFolder (hidden, app-only)" },
  { label: "Current release", value: release.version ?? "see the Download section above" },
];

export function ZenFaq({ release }: { release: ZenRelease }) {
  return (
    <ZenSection id="faq" eyebrow="Questions" title="FAQ" tone="surface">
      <div className="divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {FAQS.map((item) => (
          <details key={item.q} className="group px-6 py-4">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
              <span className="font-sans text-sm font-semibold text-foreground">{item.q}</span>
              <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{item.a}</p>
          </details>
        ))}
      </div>

      <details className="mt-8 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <summary className="cursor-pointer font-sans text-sm font-semibold text-foreground">
          For the curious — tech stack &amp; specs
        </summary>
        <div className="mt-5 divide-y divide-border font-sans text-xs">
          {CURIOUS_ROWS(release).map((row) => (
            <div key={row.label} className="grid grid-cols-1 gap-1 py-3 sm:grid-cols-12 sm:items-center">
              <span className="font-medium text-muted-foreground sm:col-span-4">{row.label}</span>
              <span className="font-mono text-foreground sm:col-span-8">{row.value}</span>
            </div>
          ))}
        </div>
        <p className="mt-4 font-mono text-[11px] text-muted-foreground">
          Version numbers on this page always come from the latest GitHub release, never hard-coded.
        </p>
      </details>
    </ZenSection>
  );
}
