"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface FaqItem {
  q: string;
  a: string;
}

const FAQS: FaqItem[] = [
  {
    q: "Is Zen free?",
    a: "Yes. Zen is a personal project, free to download and use, with no ads and no in-app purchases. A ~2 MB build without on-device AI tagging is also available if you want the smaller install.",
  },
  {
    q: "Does any of my data leave my device?",
    a: "By default, no. Everything — usage stats, tags, the age meter, notification inbox — lives in a local database on your phone or PC. Data only leaves the device if you explicitly turn on Drive sync, and even then it goes to a hidden folder in your own Google Drive, never to a server either of us runs.",
  },
  {
    q: "Why does Android call Zen an \"unknown developer\"? Is that dangerous?",
    a: "It just means the app isn't distributed through the Play Store. Zen needs permissions (Accessibility, notification access) that Play's policies don't allow for this kind of app, so it's a direct APK download instead. Google Play Protect may also warn about this on install — that's expected for any sideloaded app, not a sign something's wrong. The installer for Windows is unsigned for the same personal-project reason, which is why SmartScreen shows a warning too.",
  },
  {
    q: "Does Zen work if I don't set it as my home screen?",
    a: "Yes. In app mode it runs alongside your current launcher and still tracks and tags your day, still runs the wait timer and unbypassable blocks, still shows the age meter — you just won't get the extra friction of Zen's calm home screen replacing your app grid.",
  },
  {
    q: "I have an iPhone or a Mac — can I use Zen?",
    a: "Not yet. Zen is Android and Windows only today. There's no timeline for iOS or macOS support.",
  },
  {
    q: "How do I update Zen?",
    a: "Android: download the latest Zen.apk from this page and install over the existing app — it upgrades in place as long as it's signed with the same release key. Windows: run the latest ZenDesktopSetup.exe; the installer upgrades your existing install without a separate uninstall step.",
  },
];

export function ZenFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="mx-auto max-w-6xl px-6 py-20 md:py-28 border-t border-border">
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-background font-mono text-[10px] font-bold">
            13
          </span>
          <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Common Questions
          </span>
        </div>
        <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          FAQ
        </h2>
      </div>

      <div className="mt-10 divide-y divide-border overflow-hidden rounded-2xl border border-border bg-card">
        {FAQS.map((item, i) => {
          const isOpen = openIndex === i;
          return (
            <div key={item.q}>
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="flex w-full items-center justify-between gap-4 px-6 py-4.5 text-left"
              >
                <span className="font-sans text-sm font-semibold text-foreground">
                  {item.q}
                </span>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-6 pb-5">
                  <p className="text-sm leading-relaxed text-muted-foreground">{item.a}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
