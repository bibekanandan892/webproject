"use client";

import { Cloud, Smartphone, Laptop, ShieldCheck, GitMerge, EyeOff } from "lucide-react";

export function ZenSync() {
  return (
    <section id="sync" className="mx-auto max-w-6xl px-6 py-20 md:py-28 border-t border-border">
      {/* Section Header */}
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-background font-mono text-[10px] font-bold">
            07
          </span>
          <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            One Day, Every Device
          </span>
        </div>
        <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          All Devices
        </h2>
        <p className="max-w-3xl font-serif text-lg text-muted-foreground leading-relaxed">
          Turn on sync and Zen merges your phone and your PC into a single day — one
          timeline, one set of totals — through a hidden folder in your own Google
          Drive. It&apos;s opt-in, and off by default.
        </p>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left: how it works */}
        <div className="flex flex-col gap-4 lg:col-span-7">
          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h3 className="font-sans text-base font-bold text-foreground flex items-center gap-2">
              <Cloud className="h-4 w-4 text-muted-foreground" />
              Your Drive, not ours
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              Zen writes to a hidden, app-only folder in your Google Drive
              (Drive&apos;s <span className="font-mono text-xs">appDataFolder</span> scope) —
              the kind of folder you can&apos;t browse from the regular Drive app, and other
              apps can&apos;t see. Nothing goes to a server either of us runs.
            </p>

            <div className="mt-6 flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-1.5">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-secondary/60">
                  <Smartphone className="h-5 w-5 text-foreground" />
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">1 phone</span>
              </div>
              <GitMerge className="h-5 w-5 text-muted-foreground rotate-90" />
              <div className="flex h-12 w-12 items-center justify-center rounded-full border border-foreground bg-foreground text-background">
                <Cloud className="h-5 w-5" />
              </div>
              <GitMerge className="h-5 w-5 text-muted-foreground -rotate-90" />
              <div className="flex flex-col items-center gap-1.5">
                <span className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-secondary/60">
                  <Laptop className="h-5 w-5 text-foreground" />
                </span>
                <span className="font-mono text-[11px] text-muted-foreground">1 PC</span>
              </div>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              One phone and one PC per Google account is the supported setup. Sign in on a
              second device and Zen asks you to replace a seat before it uploads anything
              — your existing device&apos;s data isn&apos;t touched until you choose.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
            <h3 className="font-sans text-base font-bold text-foreground flex items-center gap-2">
              <GitMerge className="h-4 w-4 text-muted-foreground" />
              When phone and PC overlap
            </h3>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              If both devices show activity in the same minute, the stronger tracking
              state wins (Active beats Likely active). A tie falls back to your &quot;prefer
              phone or desktop&quot; setting — phone by default — and overlapping time is also
              marked separately as &quot;both screens&quot; so it&apos;s never silently dropped.
            </p>
          </div>
        </div>

        {/* Right: privacy */}
        <div className="flex flex-col gap-4 lg:col-span-5">
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-sans text-base font-semibold text-foreground">
              Off until you turn it on
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Sync is disabled by default on both platforms. Nothing leaves the device
              until you sign in and switch it on in Settings.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
              <EyeOff className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-sans text-base font-semibold text-foreground">
              Titles stay local unless you say otherwise
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Categories, tags, and how long you spent sync by default — page and video
              titles only sync if you separately turn on &quot;Sync titles.&quot; Private/incognito
              browsing always syncs as a generic &quot;private&quot; label.
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary text-foreground">
              <Cloud className="h-5 w-5" />
            </div>
            <h3 className="mt-4 font-sans text-base font-semibold text-foreground">
              Syncs on a schedule, not constantly
            </h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Each device checks in every 15–60 minutes (your choice), plus whenever you
              open the All Devices tab with stale data, or tap refresh yourself.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
