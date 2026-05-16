import { SectionHeading } from "@/components/section-heading";
import { techStack } from "@/data/tech";

export function Tech() {
  return (
    <section id="tech" className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <SectionHeading
        index={4}
        label="stack"
        title="What I reach for"
        subtitle="Tools I use day-to-day, not a wishlist."
      />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {techStack.map((cat) => (
          <div
            key={cat.category}
            className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:border-primary/30"
          >
            <div className="flex items-baseline justify-between">
              <h3 className="text-lg font-semibold text-foreground">
                {cat.category}
              </h3>
              <span className="font-mono text-xs text-muted-foreground">
                {cat.items.length} tools
              </span>
            </div>
            <p className="text-sm text-muted-foreground">{cat.description}</p>
            <ul className="mt-2 flex flex-wrap gap-2">
              {cat.items.map((item) => (
                <li
                  key={item.name}
                  className="rounded-md border border-border bg-secondary/60 px-3 py-1.5 font-mono text-xs text-foreground transition-colors hover:border-primary/40 hover:text-primary"
                >
                  {item.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
