import { Home, AppWindow, ArrowRight, CheckCircle2, XCircle } from "lucide-react";

interface ModeFeature {
  label: string;
  launcher: boolean | string;
  app: boolean | string;
}

const FEATURES: ModeFeature[] = [
  { label: "Home screen replaces app browsing", launcher: true, app: false },
  { label: "App drawer & pinned favourites", launcher: true, app: "Hidden" },
  { label: "Age meter on the home screen", launcher: true, app: "In Settings" },
  { label: "Today's timeline & tagging", launcher: true, app: true },
  { label: "Wait timer, unbypassable blocks & schedules", launcher: true, app: true },
  { label: "Per-app grayscale & quiet notification inbox", launcher: true, app: true },
  { label: "Back button stays inside Zen's calm screen", launcher: true, app: false },
  { label: "Runs next to your current launcher, no swap", launcher: false, app: true },
];

function Cell({ value }: { value: boolean | string }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
        <CheckCircle2 className="h-4 w-4 shrink-0" />
        <span className="text-xs font-medium">Yes</span>
      </span>
    );
  }
  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1.5 text-muted-foreground">
        <XCircle className="h-4 w-4 shrink-0" />
        <span className="text-xs font-medium">No</span>
      </span>
    );
  }
  return <span className="text-xs font-medium text-foreground">{value}</span>;
}

export function ZenModes() {
  return (
    <section id="modes" className="mx-auto max-w-6xl px-6 py-20 md:py-28 border-t border-border">
      {/* Section Header */}
      <div className="flex flex-col items-start gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-5 w-5 items-center justify-center rounded bg-foreground text-background font-mono text-[10px] font-bold">
            05
          </span>
          <span className="font-mono text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Two Ways To Use Zen
          </span>
        </div>
        <h2 className="font-sans text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Home Screen or Regular App
        </h2>
        <p className="max-w-3xl font-serif text-lg text-muted-foreground leading-relaxed">
          Zen tracks and tags your day either way. Set it as your home screen and it also
          replaces the endless app-grid browsing that leads to mindless opens — the
          drawer takes a deliberate swipe to reach, and the back button no longer lets
          you slip past it. As a regular app alongside your current launcher, you get the
          same tracking and the same focus tools, just without that extra friction.
        </p>
      </div>

      {/* Comparison — table on sm+, stacked cards below */}
      <div className="mt-10">
        {/* Table (sm and up) */}
        <div className="hidden overflow-hidden rounded-2xl border border-border sm:block">
          <div className="grid grid-cols-12 bg-secondary/40 px-6 py-3.5 font-mono text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span className="col-span-6">Feature</span>
            <span className="col-span-3 flex items-center gap-1.5">
              <Home className="h-3.5 w-3.5" /> Launcher mode
            </span>
            <span className="col-span-3 flex items-center gap-1.5">
              <AppWindow className="h-3.5 w-3.5" /> App mode
            </span>
          </div>
          <div className="divide-y divide-border bg-card">
            {FEATURES.map((f) => (
              <div key={f.label} className="grid grid-cols-12 items-center px-6 py-3.5">
                <span className="col-span-6 text-sm text-foreground">{f.label}</span>
                <span className="col-span-3">
                  <Cell value={f.launcher} />
                </span>
                <span className="col-span-3">
                  <Cell value={f.app} />
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Stacked cards (below sm) */}
        <div className="flex flex-col gap-4 sm:hidden">
          {[
            { title: "Launcher mode", icon: Home, key: "launcher" as const },
            { title: "App mode", icon: AppWindow, key: "app" as const },
          ].map(({ title, icon: Icon, key }) => (
            <div key={key} className="rounded-2xl border border-border bg-card p-5">
              <h3 className="flex items-center gap-2 font-sans text-base font-bold text-foreground">
                <Icon className="h-4 w-4 text-muted-foreground" />
                {title}
              </h3>
              <ul className="mt-4 flex flex-col gap-2.5">
                {FEATURES.map((f) => (
                  <li key={f.label} className="flex items-start justify-between gap-3 text-xs">
                    <span className="text-muted-foreground">{f.label}</span>
                    <Cell value={f[key]} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Recommendation + steps */}
      <div className="mt-10 rounded-2xl border border-border bg-card p-6 sm:p-8">
        <h3 className="font-sans text-base font-bold text-foreground">
          Recommended: set Zen as your default home
        </h3>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
          It&apos;s the setup with the strongest screen-time reduction — every unlock lands on
          a calm screen instead of a grid of app icons. You can switch back at any time.
        </p>
        <ol className="mt-5 flex flex-col gap-2 text-sm text-foreground">
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-secondary font-mono text-[10px] font-bold">1</span>
            <span>Open Zen → Settings and turn on <span className="font-medium">&quot;Set as home screen&quot;</span>.</span>
          </li>
          <li className="flex items-start gap-2.5">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-secondary font-mono text-[10px] font-bold">2</span>
            <span>
              Or do it from Android directly: <span className="font-mono text-xs">Settings → Apps → Default apps → Home app</span> → choose Zen.
            </span>
          </li>
          <li className="flex items-start gap-2.5">
            <ArrowRight className="h-3.5 w-3.5 shrink-0 mt-0.5 text-muted-foreground" />
            <span className="text-muted-foreground">
              Changed your mind? Flip the same switch off, or pick a different home app in
              Android&apos;s own settings — nothing else about Zen changes.
            </span>
          </li>
        </ol>
      </div>
    </section>
  );
}
