import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { lookingFor } from "@/data/looking-for";

export function LookingFor() {
  return (
    <section
      id="looking-for"
      className="mx-auto max-w-6xl px-6 py-24 md:py-32"
    >
      <SectionHeading
        index={2}
        label="looking for"
        title="What I want next"
      />

      <div className="rounded-2xl border border-border bg-card p-8 md:p-12">
        <h3 className="text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {lookingFor.headline}
        </h3>
        <p className="mt-4 max-w-3xl text-base leading-relaxed text-muted-foreground">
          {lookingFor.pitch}
        </p>

        <div className="mt-10 grid grid-cols-1 gap-8 md:grid-cols-3">
          <Column title="Role I want" items={[...lookingFor.role]} />
          <Column title="Domains I love" items={[...lookingFor.domains]} />
          <div className="flex flex-col gap-3">
            <p className="font-mono text-xs uppercase tracking-wider text-primary">
              How to reach me
            </p>
            <ul className="flex flex-col gap-2">
              {lookingFor.contacts.map((c) => (
                <li key={c.label}>
                  <a
                    href={c.href}
                    className="group inline-flex items-center gap-2 text-sm text-foreground transition-colors hover:text-primary"
                  >
                    <span className="font-mono text-xs text-muted-foreground group-hover:text-primary">
                      ↳
                    </span>{" "}
                    {c.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10">
          <Link
            href={lookingFor.contacts[0].href}
            className="inline-flex items-center gap-2 rounded-md border border-primary/50 bg-primary/10 px-6 py-3 font-mono text-sm text-primary transition-all hover:border-primary hover:bg-primary/20"
          >
            say hi →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Column({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-xs uppercase tracking-wider text-primary">
        {title}
      </p>
      <ul className="flex flex-col gap-2 text-sm text-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="font-mono text-xs text-muted-foreground">↳</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
