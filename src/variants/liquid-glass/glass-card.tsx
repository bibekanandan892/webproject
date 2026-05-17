"use client";

import { useRef, type CSSProperties, type ReactNode } from "react";

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  tilt?: boolean;
  glow?: boolean;
  style?: CSSProperties;
}

export function GlassCard({
  children,
  className = "",
  tilt = true,
  glow = true,
  style,
}: GlassCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    ref.current.style.setProperty("--mx", `${x * 100}%`);
    ref.current.style.setProperty("--my", `${y * 100}%`);
    if (tilt) {
      const rx = (y - 0.5) * -6;
      const ry = (x - 0.5) * 8;
      ref.current.style.setProperty("--rx", `${rx}deg`);
      ref.current.style.setProperty("--ry", `${ry}deg`);
    }
  };

  const onLeave = () => {
    if (!ref.current) return;
    ref.current.style.setProperty("--rx", `0deg`);
    ref.current.style.setProperty("--ry", `0deg`);
  };

  return (
    <div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className={`group/card glass glass-shine glass-hover ${className}`}
      style={{
        transform: "perspective(1200px) rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg))",
        transformStyle: "preserve-3d",
        ...style,
      }}
    >
      {glow && (
        <div
          className="pointer-events-none absolute inset-0 rounded-[inherit] opacity-0 transition-opacity duration-500 group-hover/card:opacity-100"
          style={{
            background:
              "radial-gradient(400px circle at var(--mx, 50%) var(--my, 50%), rgba(255,255,255,0.18), transparent 50%)",
          }}
        />
      )}
      <div className="relative" style={{ transform: "translateZ(20px)" }}>
        {children}
      </div>
    </div>
  );
}
