import type { ReactNode } from "react";

interface ZenSectionProps {
  /** Primary id this section is addressed by in the new IA. */
  id: string;
  /** Old anchor ids that used to point at this content — kept as empty,
   *  focusable-free targets so external links and bookmarks still land in
   *  the right place. `scroll-margin-top` matches the sticky product bar. */
  aliasIds?: string[];
  eyebrow: string;
  title: string;
  /** Lora lede, kept under ~60ch by the caller. */
  lede?: ReactNode;
  /** "background" (paper) or "surface" (band) — sections alternate. */
  tone?: "background" | "surface";
  children: ReactNode;
  className?: string;
  headerRight?: ReactNode;
}

export function ZenSection({
  id,
  aliasIds = [],
  eyebrow,
  title,
  lede,
  tone = "background",
  children,
  className = "",
  headerRight,
}: ZenSectionProps) {
  return (
    <section
      id={id}
      className={`scroll-mt-24 border-t border-border py-16 md:py-24 ${
        tone === "surface" ? "zen-band-surface" : ""
      } ${className}`}
    >
      {aliasIds.map((aliasId) => (
        <span key={aliasId} id={aliasId} className="scroll-mt-24 block h-0 w-0" aria-hidden="true" />
      ))}
      <div className="mx-auto max-w-6xl px-6">
        <div
          data-zen-reveal
          className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between"
        >
          <div className="flex flex-col items-start gap-3">
            <span className="font-mono text-xs font-semibold uppercase tracking-wider text-faint">
              {eyebrow}
            </span>
            <h2 className="font-sans text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {title}
            </h2>
            {lede && (
              <p className="max-w-[60ch] font-serif text-lg leading-relaxed text-muted-foreground">
                {lede}
              </p>
            )}
          </div>
          {headerRight}
        </div>

        <div data-zen-reveal className="mt-10">
          {children}
        </div>
      </div>
    </section>
  );
}
