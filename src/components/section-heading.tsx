interface SectionHeadingProps {
  title: string;
  subtitle?: string;
}

export function SectionHeading({ title, subtitle }: SectionHeadingProps) {
  return (
    <div className="mb-12 flex flex-col gap-3 border-b border-border pb-6 md:mb-16">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:gap-6">
        <h2 className="font-sans text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="text-base text-muted-foreground md:pb-1">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
