"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { ZEN_SHOTS, zenShotAsset } from "./zen-shots";
import { ZenPicture } from "./zen-picture";

interface ZenLightboxContextValue {
  open: (src: string) => void;
}

const ZenLightboxContext = createContext<ZenLightboxContextValue | null>(null);

export function useZenLightbox(): ZenLightboxContextValue {
  const ctx = useContext(ZenLightboxContext);
  if (!ctx) throw new Error("useZenLightbox must be used inside <ZenLightboxProvider>");
  return ctx;
}

/**
 * Steps through all 15 screenshots (arrow keys), closes on Escape or
 * backdrop click, traps focus while open, and restores focus to the
 * trigger on close. Renders nothing extra in server HTML — the dialog only
 * exists once a screenshot is activated client-side.
 */
export function ZenLightboxProvider({ children }: { children: ReactNode }) {
  const [index, setIndex] = useState<number | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);

  const open = useCallback((src: string) => {
    triggerRef.current = document.activeElement as HTMLElement | null;
    const i = ZEN_SHOTS.findIndex((s) => s.src === src);
    setIndex(i >= 0 ? i : 0);
  }, []);

  const close = useCallback(() => {
    setIndex(null);
    triggerRef.current?.focus?.();
  }, []);

  const step = useCallback((delta: number) => {
    setIndex((i) => {
      if (i === null) return i;
      const next = (i + delta + ZEN_SHOTS.length) % ZEN_SHOTS.length;
      return next;
    });
  }, []);

  useEffect(() => {
    if (index === null) return;
    closeButtonRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        close();
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        step(1);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        step(-1);
      } else if (e.key === "Tab") {
        // Simple focus trap: the dialog only has two focusable descendants
        // besides the two arrow buttons, so cycle within the dialog.
        const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
          'button, [href], [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable || focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", onKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [index, close, step]);

  const value = useMemo(() => ({ open }), [open]);
  const shot = index !== null ? ZEN_SHOTS[index] : null;
  const asset = shot ? zenShotAsset(shot.src) : null;

  return (
    <ZenLightboxContext.Provider value={value}>
      {children}
      {shot && asset && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Screenshot: ${shot.caption}`}
          className="fixed inset-0 z-100 flex flex-col items-center justify-center gap-4 bg-black/90 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={close}
            aria-label="Close screenshot viewer"
            className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={() => step(-1)}
            aria-label="Previous screenshot"
            className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 sm:left-6"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => step(1)}
            aria-label="Next screenshot"
            className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/20 bg-white/10 text-white hover:bg-white/20 sm:right-6"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          {/* eslint-disable-next-line @next/next/no-img-element -- lightbox
              needs a plain <img> sized to the viewport, not a fixed intrinsic
              size; the static export already serves it unoptimized. */}
          <img
            src={asset.png}
            alt={shot.alt}
            className="max-h-[75vh] max-w-full rounded-lg object-contain shadow-2xl"
          />
          <p className="max-w-lg text-center font-sans text-sm text-white/80">
            {shot.caption}
            <span className="ml-2 font-mono text-xs text-white/50">
              {index !== null ? index + 1 : 0} / {ZEN_SHOTS.length}
            </span>
          </p>
        </div>
      )}
    </ZenLightboxContext.Provider>
  );
}

interface ZenLightboxImageProps {
  src: string;
  alt: string;
  className?: string;
  aspectClassName?: string;
  priority?: boolean;
}

/**
 * A ZenPicture that opens the shared lightbox on click. A standalone client
 * component (rather than a render-prop) so it can be dropped into a Server
 * Component parent (zen-hero.tsx, zen-focus.tsx, zen-desktop.tsx) without
 * passing a function across the server/client boundary, which React can't
 * serialize.
 */
export function ZenLightboxImage({ src, alt, className, aspectClassName, priority }: ZenLightboxImageProps) {
  const { open } = useZenLightbox();
  return (
    <ZenPicture
      src={src}
      alt={alt}
      className={className}
      aspectClassName={aspectClassName}
      priority={priority}
      onClick={() => open(src)}
    />
  );
}
