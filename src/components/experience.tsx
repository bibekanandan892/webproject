import Image from "next/image";
import { SectionHeading } from "@/components/section-heading";
import { experiences } from "@/data/experience";

export function Experience() {
  return (
    <section
      id="experience"
      className="mx-auto max-w-6xl px-6 py-24 md:py-32"
    >
      <SectionHeading
        index={3}
        label="experience"
        title="Where I've shipped"
      />

      <ol className="relative ml-3 border-l border-border md:ml-4">
        {experiences.map((exp) => (
          <li key={exp.company} className="relative pl-8 pb-12 md:pl-12">
            <span className="absolute -left-[7px] top-2 h-3 w-3 rounded-full border-2 border-primary bg-background md:-left-[9px] md:h-4 md:w-4" />
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
              <div className="flex shrink-0 items-start gap-3 md:w-48">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
                  <Image
                    src={exp.logo}
                    alt={`${exp.company} logo`}
                    fill
                    sizes="40px"
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col">
                  <p className="font-mono text-xs text-muted-foreground">
                    {exp.from}
                    {" — "}
                    {exp.to}
                  </p>
                  <p className="font-semibold text-foreground">{exp.company}</p>
                </div>
              </div>
              <div className="flex flex-1 flex-col gap-3">
                <h3 className="text-lg font-semibold text-primary md:text-xl">
                  {exp.role}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {exp.description}
                </p>
                <ul className="flex flex-col gap-1.5 text-sm text-foreground">
                  {exp.highlights.map((h) => (
                    <li key={h} className="flex gap-2">
                      <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-primary" />
                      <span className="text-muted-foreground">{h}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
