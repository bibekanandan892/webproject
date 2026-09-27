import Image from "next/image";
import { ShieldCheck, ArrowDown } from "lucide-react";
import {
  ZEN_ANDROID_APK_URL,
  ZEN_WINDOWS_INSTALLER_URL,
  formatAssetSize,
  formatReleaseDate,
  type ZenRelease,
} from "@/lib/zen-release";
import { ZenDownloadButtons } from "./zen-download-cta";

export function ZenHero({ release }: { release: ZenRelease }) {
  const androidSize = formatAssetSize(release.android.sizeBytes);
  const windowsSize = formatAssetSize(release.windows.sizeBytes);
  const publishedDate = formatReleaseDate(release.publishedAt);

  return (
    <section id="overview" className="relative overflow-hidden pt-8 pb-16 md:pt-14 md:pb-24">
      {/* Subtle ambient background glow */}
      <div
        className="pointer-events-none absolute -top-24 left-1/2 -z-10 h-[480px] w-[700px] -translate-x-1/2 rounded-full opacity-25 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, var(--foreground) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
          {/* Left Column: Product pitch & metrics */}
          <div className="flex flex-col items-start lg:col-span-7">
            {/* Badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 font-mono text-[11px] font-medium text-foreground">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {release.version ? (
                  <span>
                    {release.version}
                    {publishedDate ? ` · ${publishedDate}` : ""}
                  </span>
                ) : (
                  <span>Free · beta</span>
                )}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1 font-mono text-[11px] text-muted-foreground">
                Android 8.0+ &amp; Windows 10/11
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1 font-mono text-[11px] text-muted-foreground">
                <ShieldCheck className="h-3 w-3 text-emerald-500" />
                Everything stays on your device
              </span>
            </div>

            <h1 className="mt-6 font-sans text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Zen
            </h1>

            <p className="mt-4 font-serif text-xl leading-relaxed text-muted-foreground sm:text-2xl">
              See how your day is really spent — on your phone and your PC.
            </p>

            <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
              A calm Android home screen and a Windows companion that track every minute,
              tag it Learn, Productive, Fun, or Waste, and put real friction between you
              and the apps that don&apos;t deserve your time — a live Memento Mori age meter,
              an honest per-app timeline, and on-device AI classification, all local.
            </p>

            {/* CTA Buttons */}
            <div className="mt-8 flex flex-col gap-3">
              <ZenDownloadButtons
                androidHref={ZEN_ANDROID_APK_URL}
                androidSublabel={androidSize ?? undefined}
                windowsHref={ZEN_WINDOWS_INSTALLER_URL}
                windowsSublabel={windowsSize ?? undefined}
                size="compact"
              />
              <a
                href="#download"
                className="inline-flex w-fit items-center gap-2 font-mono text-xs text-muted-foreground hover:text-foreground"
              >
                <span>How to install</span>
                <ArrowDown className="h-3.5 w-3.5" />
              </a>
            </div>

            {/* Highlights Grid */}
            <div className="mt-10 grid grid-cols-2 gap-4 border-t border-border pt-8 sm:grid-cols-3">
              <div>
                <p className="font-mono text-xs text-muted-foreground">PHILOSOPHY</p>
                <p className="mt-1 font-sans text-sm font-semibold text-foreground">
                  Distraction-Free
                </p>
                <p className="text-xs text-muted-foreground">Monochrome & calm text</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground">MEMENTO MORI</p>
                <p className="mt-1 font-sans text-sm font-semibold text-foreground">
                  Live Age Meter
                </p>
                <p className="text-xs text-muted-foreground">7 styles · 9 decimals</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground">INTELLIGENCE</p>
                <p className="mt-1 font-sans text-sm font-semibold text-foreground">
                  On-Device AI
                </p>
                <p className="text-xs text-muted-foreground">Gemma 3 1B · 100% offline</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground">SCREEN TIME</p>
                <p className="mt-1 font-sans text-sm font-semibold text-foreground">
                  Timeline Colors
                </p>
                <p className="text-xs text-muted-foreground">Productive · Fun · Waste</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground">FOCUS</p>
                <p className="mt-1 font-sans text-sm font-semibold text-foreground">
                  Wait Timers & Blocker
                </p>
                <p className="text-xs text-muted-foreground">Unbypassable discipline</p>
              </div>
              <div>
                <p className="font-mono text-xs text-muted-foreground">PRIVACY</p>
                <p className="mt-1 font-sans text-sm font-semibold text-foreground">
                  Zero Telemetry
                </p>
                <p className="text-xs text-muted-foreground">Local Room SQLite only</p>
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Phone Device Showcase */}
          <div className="flex justify-center lg:col-span-5">
            <div className="relative">
              {/* Outer phone chassis */}
              <div className="relative w-[280px] sm:w-[310px] rounded-[48px] border-[10px] border-neutral-900 bg-black p-3 shadow-2xl ring-1 ring-white/10 dark:border-neutral-800 dark:ring-white/15">
                {/* Speaker pill notch */}
                <div className="absolute top-4 left-1/2 h-4 w-24 -translate-x-1/2 rounded-full bg-neutral-950 flex items-center justify-center z-20">
                  <div className="h-2.5 w-2.5 rounded-full bg-neutral-900 border border-neutral-800 mr-2" />
                  <div className="h-1.5 w-10 rounded-full bg-neutral-900" />
                </div>

                {/* Screen container */}
                <div className="relative aspect-[9/19.5] w-full overflow-hidden rounded-[36px] bg-black">
                  <Image
                    src="/zen/p1_home.png"
                    alt="Zen Android home screen with circular clock and battery ring"
                    fill
                    priority
                    sizes="(min-width: 640px) 310px, 280px"
                    className="object-cover"
                  />
                  {/* Subtle screen reflection gradient */}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/10" />
                </div>

                {/* Bottom home indicator line */}
                <div className="absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-neutral-700" />
              </div>

              {/* Floating callout badge: Battery Ring */}
              <div className="absolute -top-3 -right-4 rounded-xl border border-border bg-card/95 p-2.5 shadow-lg backdrop-blur-md sm:-right-8">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 font-mono text-[10px]">
                    ⚡
                  </span>
                  <div>
                    <p className="font-sans text-[11px] font-semibold text-foreground">
                      Live Battery Ring
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      Animates while charging
                    </p>
                  </div>
                </div>
              </div>

              {/* Floating callout badge: Thumb Zone */}
              <div className="absolute -bottom-4 -left-4 rounded-xl border border-border bg-card/95 p-2.5 shadow-lg backdrop-blur-md sm:-left-8">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 font-mono text-[10px]">
                    ✓
                  </span>
                  <div>
                    <p className="font-sans text-[11px] font-semibold text-foreground">
                      Thumb Zone Reach
                    </p>
                    <p className="font-mono text-[10px] text-muted-foreground">
                      Pin, reorder, rename
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
