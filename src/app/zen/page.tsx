import type { Metadata } from "next";
import "./zen.css";
import { ZenProductBar } from "@/components/zen/zen-product-bar";
import { ZenStickyDownload } from "@/components/zen/zen-sticky-download";
import { ZenReveal } from "@/components/zen/zen-reveal";
import { ZenLightboxProvider } from "@/components/zen/zen-lightbox";
import { ZenHero } from "@/components/zen/zen-hero";
import { ZenHowItWorks } from "@/components/zen/zen-how-it-works";
import { ZenSee } from "@/components/zen/zen-see";
import { ZenFocus } from "@/components/zen/zen-focus";
import { ZenLookUp } from "@/components/zen/zen-look-up";
import { ZenDesktop } from "@/components/zen/zen-desktop";
import { ZenPrivacy } from "@/components/zen/zen-privacy";
import { ZenDownload } from "@/components/zen/zen-download";
import { ZenFaq } from "@/components/zen/zen-faq";
import { Footer } from "@/components/footer";
import { getZenRelease } from "@/lib/zen-release";
import { zenShotAsset } from "@/components/zen/zen-shots";

export const metadata: Metadata = {
  title: "Zen — see your day, on your phone and your PC",
  description:
    "Zen shows how your day is really spent, on Android and Windows, and adds real friction to the apps that don't deserve your time. A live age meter, an honest per-app timeline, and on-device AI — everything stays on your device.",
  keywords: [
    "Zen",
    "Zen Launcher",
    "Zen Desktop",
    "Android Launcher",
    "Screen Time Tracker",
    "Windows Activity Tracker",
    "Memento Mori Clock",
    "Digital Wellbeing",
    "On-device AI",
  ],
  openGraph: {
    title: "Zen — see your day, on your phone and your PC",
    description:
      "A live age meter, an honest per-app timeline, and real friction against the apps that waste your time — on Android and Windows, all on-device.",
    url: "https://bibekananda.in/zen/",
    type: "website",
    siteName: "Bibekananda Nayak",
    images: [{ url: "https://bibekananda.in/zen/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zen — see your day, on your phone and your PC",
    description:
      "A live age meter, an honest per-app timeline, and on-device AI — for your phone and your PC.",
    images: ["https://bibekananda.in/zen/og.png"],
  },
};

export default async function ZenProductPage() {
  const release = await getZenRelease();
  const heroAsset = zenShotAsset("windows/dashboard.png");

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground transition-colors">
      {/* Preload the hero LCP image (see zen-hero.tsx). Next.js hoists a
          <link> rendered anywhere in the tree into <head>. */}
      <link rel="preload" as="image" href={heroAsset.webp2x} fetchPriority="high" />

      <ZenReveal />
      <ZenProductBar />

      <ZenLightboxProvider>
        <main className="flex-1 pb-16 md:pb-0">
          <ZenHero release={release} />
          <ZenHowItWorks />
          <ZenSee />
          <ZenFocus />
          <ZenLookUp />
          <ZenDesktop />
          <ZenPrivacy />
          <ZenDownload release={release} />
          <ZenFaq release={release} />
        </main>
      </ZenLightboxProvider>

      <ZenStickyDownload />
      <Footer />
    </div>
  );
}
