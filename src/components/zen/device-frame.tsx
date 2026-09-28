import type { ReactNode } from "react";

interface DeviceFrameProps {
  variant: "phone" | "window";
  children: ReactNode;
  className?: string;
  /** Window title bar label (variant="window" only). */
  label?: string;
}

/**
 * The one device surface every screenshot and interactive demo sits in:
 * a single dark colour (#0B0D0F, see zen.css `.zen-device-surface`), one
 * radius per variant, one shadow, one hairline border. Replaces the four
 * different near-black blocks the old page drew per section.
 */
export function DeviceFrame({ variant, children, className = "", label }: DeviceFrameProps) {
  if (variant === "phone") {
    return (
      <div
        className={`relative w-fit rounded-[40px] border-[8px] border-neutral-900 bg-neutral-900 p-0 shadow-2xl ring-1 ring-white/10 dark:border-neutral-800 dark:ring-white/15 ${className}`}
      >
        <div className="absolute top-3 left-1/2 z-20 h-3 w-16 -translate-x-1/2 rounded-full bg-neutral-950" />
        <div className="zen-device-surface overflow-hidden rounded-[32px]">{children}</div>
      </div>
    );
  }

  return (
    <div
      className={`zen-device-surface overflow-hidden rounded-2xl text-neutral-100 ${className}`}
    >
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
        <span className="h-2.5 w-2.5 rounded-full bg-neutral-700" />
        {label && (
          <span className="ml-2 font-mono text-[11px] text-neutral-400 truncate">{label}</span>
        )}
      </div>
      {children}
    </div>
  );
}
