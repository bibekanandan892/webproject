interface SectionHeadingProps {
  index: number;
  label: string;
  title: string;
  subtitle?: string;
}

export function SectionHeading({
  index,
  label,
  title,
  subtitle,
}: SectionHeadingProps) {
  const idx = String(index).padStart(2, "0");
  return (
    <div className="mb-12 flex flex-col gap-3 md:mb-16">
      <p className="font-mono text-xs text-primary">
        <span className="text-primary/60">::</span> {idx}{" "}
        <span className="text-primary/60">/</span> {label}
      </p>
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-6">
        <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
          {title}
        </h2>
        {subtitle && (
          <p className="text-base text-muted-foreground md:pb-1">{subtitle}</p>
        )}
      </div>
      <div className="mt-2 h-px w-full bg-gradient-to-r from-primary/40 via-border to-transparent" />
    </div>
  );
}
