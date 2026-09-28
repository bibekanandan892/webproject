import { ArrowDown, Layers, Hand, ShieldCheck } from "lucide-react";
import {
  ZEN_ANDROID_APK_URL,
  ZEN_WINDOWS_INSTALLER_URL,
  formatAssetSize,
  formatReleaseDate,
  type ZenRelease,
} from "@/lib/zen-release";
import { ZenDownloadButtons } from "./zen-download-cta";
import { DeviceFrame } from "./device-frame";
import { ZenLightboxImage } from "./zen-lightbox";

const PROOF_POINTS = [
  { icon: Layers, text: "Tracks phone and PC in one day" },
  { icon: Hand, text: "Adds friction to the apps you choose" },
  { icon: ShieldCheck, text: "Everything stays on your devices" },
];

export function ZenHero({ release }: { release: ZenRelease }) {
  const androidSize = formatAssetSize(release.android.sizeBytes);
  const windowsSize = formatAssetSize(release.windows.sizeBytes);
  const publishedDate = formatReleaseDate(release.publishedAt);

  return (
    <section id="overview" className="relative scroll-mt-24 overflow-hidden pt-10 pb-16 md:pt-16 md:pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-8">
          <div className="flex flex-col items-start lg:col-span-6">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card/80 px-3 py-1 font-mono text-[11px] font-medium text-foreground">
              <span className="h-1.5 w-1.5 rounded-full bg-[color:var(--zen-learn)]" />
              {release.version ? (
                <span>
                  {release.version}
                  {publishedDate ? ` · ${publishedDate}` : ""}
                </span>
              ) : (
                <span>Free · beta</span>
              )}
            </span>

            <h1 className="mt-5 font-sans text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
              See how your day really went
            </h1>
            <p className="mt-4 font-serif text-xl leading-relaxed text-muted-foreground">
              On your phone and your PC — one calm home screen, one honest timeline.
            </p>

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

            <ul className="mt-10 flex flex-col gap-3 border-t border-border pt-8 sm:flex-row sm:gap-6">
              {PROOF_POINTS.map((p) => {
                const Icon = p.icon;
                return (
                  <li key={p.text} className="flex items-start gap-2 text-sm text-foreground">
                    <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                    <span>{p.text}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex justify-center lg:col-span-6">
            <div className="relative w-full max-w-[460px]">
              <DeviceFrame variant="window" label="Zen Desktop — Today" className="w-full">
                <ZenLightboxImage
                  src="windows/dashboard.png"
                  alt="Zen Desktop dashboard showing today's timeline, age meter and top apps"
                  priority
                />
              </DeviceFrame>
              <div className="absolute -bottom-10 -right-6 w-[38%] min-w-[110px] sm:-right-10">
                <DeviceFrame variant="phone" className="w-full">
                  <ZenLightboxImage
                    src="android/home.png"
                    alt="Zen Android home screen with clock, age meter and pinned apps"
                    priority
                  />
                </DeviceFrame>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
