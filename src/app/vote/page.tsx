"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { VARIANTS, type VariantId } from "@/variants/registry";
import { fetchCounts, getMyVotes, toggleVote, isSupabaseConfigured } from "@/lib/votes";
import { fetchMainVariant } from "@/lib/main-variant";
import { VariantCard } from "@/components/vote/VariantCard";
import { AdminGate } from "@/components/vote/AdminGate";

export default function VotePage() {
  const [counts, setCounts] = useState<Partial<Record<VariantId, number>>>({});
  const [mine, setMine] = useState<Set<VariantId>>(new Set());
  const [mainId, setMainId] = useState<VariantId | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [ready, setReady] = useState(false);

  const configured = isSupabaseConfigured();

  useEffect(() => {
    setMine(getMyVotes());
    if (!configured) {
      setReady(true);
      return;
    }
    let cancelled = false;
    Promise.all([fetchCounts(), fetchMainVariant()]).then(([c, m]) => {
      if (cancelled) return;
      setCounts(c);
      setMainId(m);
      setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, [configured]);

  const handleToggle = useCallback(
    async (id: VariantId) => {
      const newCount = await toggleVote(id);
      if (newCount != null) {
        setCounts((c) => ({ ...c, [id]: newCount }));
      }
      setMine(getMyVotes());
    },
    [],
  );

  const totalVotes = useMemo(
    () => Object.values(counts).reduce((s, n) => s + (n ?? 0), 0),
    [counts],
  );

  const mailtoBody = useMemo(() => {
    const picks = [...mine]
      .map((id) => `- ${VARIANTS.find((v) => v.id === id)?.name ?? id}`)
      .join("%0D%0A");
    return `mailto:bibekanandan892@gmail.com?subject=Portfolio%20vote&body=My%20picks%3A%0D%0A${picks || "(none)"}`;
  }, [mine]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-[0.3em] text-[var(--primary)]">Vote</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
            Pick the portfolio that should ship
          </h1>
          <p className="mt-2 max-w-xl text-sm text-[var(--muted-foreground)]">
            Open any card to preview the full site in a new tab. Tap{" "}
            <span className="text-[var(--foreground)]">👍</span> for each variant
            you like — votes are public and live.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AdminGate isAdmin={isAdmin} onUnlock={() => setIsAdmin(true)} />
          <Link
            href="/"
            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          >
            ← back home
          </Link>
        </div>
      </header>

      {!configured && (
        <div className="mb-6 rounded-md border border-yellow-500/40 bg-yellow-500/10 p-4 text-sm text-yellow-300">
          Supabase isn&apos;t configured. Vote counts won&apos;t persist. Set{" "}
          <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
          <code className="rounded bg-black/30 px-1">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> in{" "}
          <code className="rounded bg-black/30 px-1">.env.local</code> and restart dev.
        </div>
      )}

      <div className="mb-6 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
        <span>
          {ready ? `${totalVotes} total votes across ${VARIANTS.length} variants` : "Loading counts…"}
        </span>
        {mine.size > 0 && (
          <a
            href={mailtoBody}
            className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-[var(--foreground)] transition hover:bg-white/10"
          >
            Email my picks ({mine.size}) ✉
          </a>
        )}
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {VARIANTS.map((v) => (
          <VariantCard
            key={v.id}
            variant={v}
            count={counts[v.id] ?? 0}
            hasVoted={mine.has(v.id)}
            isMain={mainId === v.id}
            isAdmin={isAdmin}
            onToggleVote={handleToggle}
          />
        ))}
      </div>

      <footer className="mt-12 flex flex-wrap items-center justify-between gap-3 border-t border-white/5 pt-6 text-xs text-[var(--muted-foreground)]">
        <span>Shareable link: <code className="rounded bg-black/30 px-1.5 py-0.5">bibekananda.in/vote</code></span>
        <span>{configured ? "Live counts via Supabase" : "Local-only (Supabase not configured)"}</span>
      </footer>
    </main>
  );
}
