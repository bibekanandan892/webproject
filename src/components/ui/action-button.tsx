import { cva, type VariantProps } from "class-variance-authority";

/**
 * The three-tier button system measured off anthropic.com (see
 * execution.md §1.6): primary (filled ink), secondary (outlined, inverts on
 * hover), tertiary (faint hairline, firms up on hover). Every real usage on
 * this site is a navigational <Link> or <a>, not a form action, so this is
 * exported as a bare cva rather than wrapped in a component — apply it
 * directly: `className={cn(actionButtonVariants({ tier: "primary" }), "...")}`.
 *
 * Secondary's hover relies on --foreground/--background being theme-aware:
 * `hover:bg-foreground hover:text-background` inverts correctly in both the
 * light and dark palettes without a dark: override, because those two tokens
 * are already opposites of each other in both themes.
 */
export const actionButtonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 rounded-lg border px-4 py-2 font-sans text-base font-normal transition-[border-color,color,background-color] duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      tier: {
        primary:
          "border-primary bg-primary text-primary-foreground hover:border-primary-hover hover:bg-primary-hover",
        secondary:
          "border-foreground bg-transparent text-foreground hover:bg-foreground hover:text-background",
        tertiary:
          "border-border bg-transparent text-foreground hover:border-foreground",
      },
    },
    defaultVariants: {
      tier: "primary",
    },
  },
);

export type ActionButtonVariants = VariantProps<typeof actionButtonVariants>;
