import { ZenSection } from "./zen-section";
import { ZenPicture } from "./zen-picture";

const PILLARS = [
  {
    tag: "See",
    title: "See exactly where the day goes",
    desc: "A live age meter sits on your home screen, and a real timeline breaks today into minutes.",
    href: "#see",
    linkLabel: "See the timeline",
    shot: "windows/timeline.png",
  },
  {
    tag: "Slow down",
    title: "Make the impulsive opens harder",
    desc: "A wait timer, blocks you can't skip, and a calm home screen instead of an app grid.",
    href: "#focus",
    linkLabel: "See the focus tools",
    shot: "android/focus.png",
  },
  {
    tag: "Look up",
    title: "Get greeted for putting it down",
    desc: "An hour or more away from the screen earns a quiet reward on unlock, not another nag.",
    href: "#look-up",
    linkLabel: "See screen-free rewards",
    shot: "android/screen-free.png",
  },
  {
    tag: "Understand",
    title: "Learn and Productive vs Fun and Waste",
    desc: "Every app, site and video gets sorted into a category — tag it yourself, or let on-device AI do it.",
    href: "#see",
    linkLabel: "See the tags",
    shot: "windows/tags.png",
  },
];

export function ZenHowItWorks() {
  return (
    <ZenSection
      id="how-it-helps"
      eyebrow="How it works"
      title="Less screen time. More of the picture."
      lede="Zen works on two fronts: it shows you the truth about your day, and it makes the apps that eat your time a little harder to fall into."
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {PILLARS.map((p) => (
          <a
            key={p.tag}
            href={p.href}
            className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:border-foreground/30 hover:shadow-sm"
          >
            <ZenPicture src={p.shot} alt={p.title} aspectClassName="aspect-[4/3]" />
            <div className="flex flex-1 flex-col p-5">
              <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-faint">
                {p.tag}
              </span>
              <h3 className="mt-1 font-sans text-base font-semibold text-foreground">{p.title}</h3>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{p.desc}</p>
              <span className="mt-4 font-sans text-xs font-medium text-[color:var(--accent-strong)] underline decoration-dotted underline-offset-4 group-hover:decoration-solid">
                {p.linkLabel}
              </span>
            </div>
          </a>
        ))}
      </div>
    </ZenSection>
  );
}
