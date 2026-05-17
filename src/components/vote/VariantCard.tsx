"use client";

import Image from "next/image";
import { useState } from "react";
import type { VariantId, VariantMeta } from "@/variants/registry";
import { setMainVariant } from "@/lib/main-variant";

interface VariantCardProps {
  variant: VariantMeta;
  count: number;
  hasVoted: boolean;
  isMain: boolean;
  isAdmin: boolean;
  onToggleVote: (id: VariantId) => void;
}

export function VariantCard({
  variant,
  count,
  hasVoted,
  isMain,
  isAdmin,
  onToggleVote,
}: VariantCardProps) {
  const [pending, setPending] = useState(false);
  const [makingMain, setMakingMain] = useState(false);

  const previewHref = `/preview/${variant.id}/`;

  const handleMakeMain = async () => {
    if (!isAdmin) return;
    setMakingMain(true);
    const ok = await setMainVariant(variant.id);
    setMakingMain(false);
    if (ok) {
      // Soft refresh — vote page will refetch on next mount.
      window.location.reload();
    } else {
      alert("Failed to set main variant. Check Supabase setup.");
    }
  };

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-lg border bg-[var(--card)] transition-all hover:-translate-y-0.5 hover:shadow-lg ${
        isMain ? "border-[var(--primary)] shadow-[0_0_0_1px_var(--primary)]" : "border-white/10"
      }`}
    >
      {/* Thumbnail */}
      <a
        href={previewHref}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-[16/10] overflow-hidden bg-[var(--surface)]"
      >
        <Image
          src={`/thumbs/${variant.id}.png`}
          alt={`${variant.name} preview`}
          fill
          className="object-cover transition-transform duration-500 group-hover:scale-105"
          unoptimized
        />
        {isMain && (
          <span className="absolute left-3 top-3 rounded-full bg-[var(--primary)] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-[var(--primary-foreground)]">
            Main site
          </span>
        )}
        <span
          className="absolute right-3 top-3 size-3 rounded-full ring-2 ring-black/40"
          style={{ backgroundColor: variant.accent }}
          aria-hidden
        />
        <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/80 to-transparent px-3 py-3 text-xs text-white/85">
          <span className="opacity-90">Click to open full preview ↗</span>
        </span>
      </a>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-base font-semibold text-[var(--foreground)]">{variant.name}</h3>
          <p className="mt-0.5 text-xs text-[var(--muted-foreground)] line-clamp-2">{variant.blurb}</p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-2">
          <button
            type="button"
            disabled={pending}
            onClick={async () => {
              setPending(true);
              await onToggleVote(variant.id);
              setPending(false);
            }}
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition disabled:opacity-50 ${
              hasVoted
                ? "border-[var(--primary)] bg-[var(--primary)]/15 text-[var(--primary)]"
                : "border-white/15 bg-white/[0.04] text-[var(--foreground)] hover:bg-white/10"
            }`}
          >
            <span aria-hidden>{hasVoted ? "✓" : "👍"}</span>
            <span className="tabular-nums">{count}</span>
            <span className="text-xs opacity-70">{hasVoted ? "voted" : "vote"}</span>
          </button>

          {isAdmin && !isMain && (
            <button
              type="button"
              disabled={makingMain}
              onClick={handleMakeMain}
              className="rounded-full border border-[var(--primary)]/50 bg-[var(--primary)]/10 px-3 py-1.5 text-xs font-medium text-[var(--primary)] transition hover:bg-[var(--primary)]/20 disabled:opacity-50"
            >
              {makingMain ? "Setting…" : "Make main"}
            </button>
          )}
          {isAdmin && isMain && (
            <span className="text-[10px] uppercase tracking-widest text-[var(--primary)]">current</span>
          )}
        </div>
      </div>
    </article>
  );
}
