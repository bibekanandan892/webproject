import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { STATUS_LABELS, nowEntries, type WorkStatus } from "@/data/now";
import { ArrowUpRight } from "lucide-react";

const STATUS_STYLE: Record<WorkStatus, React.CSSProperties> = {
  "in-progress": {
    borderColor: "rgba(100, 255, 218, 0.4)",
    backgroundColor: "rgba(100, 255, 218, 0.1)",
    color: "#64FFDA",
  },
  "shipping-soon": {
    borderColor: "rgba(125, 211, 252, 0.4)",
    backgroundColor: "rgba(125, 211, 252, 0.1)",
    color: "#7DD3FC",
  },
  research: {
    borderColor: "rgba(167, 139, 250, 0.4)",
    backgroundColor: "rgba(167, 139, 250, 0.1)",
    color: "#A78BFA",
  },
};

export function Now() {
  return (
    <section id="now" className="mx-auto max-w-6xl px-6 py-24 md:py-32">
      <SectionHeading
        index={1}
        label="now"
        title="What I'm building"
        subtitle="Active threads right now."
      />
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {nowEntries.map((entry) => (
          <article
            key={entry.title}
            className="group relative flex flex-col gap-4 rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:bg-card/80"
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                {entry.title}
              </h3>
              <span
                className="shrink-0 rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider"
                style={STATUS_STYLE[entry.status]}
              >
                {STATUS_LABELS[entry.status]}
              </span>
            </div>

            <p className="flex-1 text-sm leading-relaxed text-muted-foreground">
              {entry.description}
            </p>

            <div className="flex flex-wrap gap-2">
              {entry.techStack.map((tech) => (
                <span
                  key={tech}
                  className="rounded-md border border-border bg-secondary/40 px-2 py-1 font-mono text-[10px] text-muted-foreground"
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
                className="mt-2 inline-flex items-center gap-1 font-mono text-xs text-primary transition-all hover:gap-2"
              >
                view <ArrowUpRight className="h-3 w-3" />
              </Link>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
