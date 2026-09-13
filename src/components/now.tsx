import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { STATUS_LABELS, nowEntries, type WorkStatus } from "@/data/now";
import { ArrowUpRight } from "lucide-react";

/**
 * Card tints from the design tokens, not raw hex — the badge composites the
 * tint at low opacity over whatever surface sits behind it, so it reads
 * correctly on both the light and dark card backgrounds without a separate
 * override.
 *
 * The Lava Rush palette is four colours, so these three statuses can no longer
 * each get a hue of their own. They now read as an intensity ramp instead:
 * active work is lava, imminent work is ash, and speculative work is gunmetal —
 * which is arguably more honest signalling than three unrelated pastels were.
 */
const STATUS_TINT: Record<WorkStatus, string> = {
  "in-progress": "var(--tint-lava)",
  "shipping-soon": "var(--tint-ash)",
  research: "var(--tint-gunmetal)",
};

export function Now() {
  return (
    <section id="now" className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <SectionHeading
        title="What I'm building"
        subtitle="Active threads right now."
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {nowEntries.map((entry) => (
          <article
            key={entry.title}
            className="group relative flex flex-col gap-4 rounded-card border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-border-hover"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-foreground">
                {entry.title}
              </h3>
              <span
                className="shrink-0 rounded-full border px-2.5 py-1 font-sans text-xs font-medium text-foreground"
                style={{
                  backgroundColor: `color-mix(in srgb, ${STATUS_TINT[entry.status]} 35%, transparent)`,
                  borderColor: `color-mix(in srgb, ${STATUS_TINT[entry.status]} 60%, transparent)`,
                }}
              >
                {STATUS_LABELS[entry.status]}
              </span>
            </div>

            <p className="flex-1 text-base text-muted-foreground">
              {entry.description}
            </p>

            <div className="flex flex-wrap gap-2">
              {entry.techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-md border border-border bg-secondary/40 px-2 py-1 font-mono text-xs text-muted-foreground"
                >
                  {tech}
                </span>
              ))}
            </div>

            {entry.link && (
              <Link
                href={entry.link}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 font-sans text-sm text-foreground transition-all hover:gap-2"
              >
                View <ArrowUpRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
