"use client";

import { getSupabase, isSupabaseConfigured } from "./supabase";
import type { VariantId } from "@/variants/registry";
import { VARIANT_IDS } from "@/variants/registry";

const STORAGE_KEY = "bibek-vote-mine";

export type VoteCounts = Partial<Record<VariantId, number>>;

function readMineFromStorage(): Set<VariantId> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw) as string[];
    return new Set(arr.filter((id): id is VariantId => VARIANT_IDS.includes(id as VariantId)));
  } catch {
    return new Set();
  }
}

function writeMineToStorage(mine: Set<VariantId>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...mine]));
}

export function getMyVotes(): Set<VariantId> {
  return readMineFromStorage();
}

export async function fetchCounts(): Promise<VoteCounts> {
  const sb = getSupabase();
  if (!sb) return {};
  const { data, error } = await sb
    .from("votes")
    .select("variant_id, count");
  if (error || !data) return {};
  const out: VoteCounts = {};
  for (const row of data as Array<{ variant_id: string; count: number }>) {
    if (VARIANT_IDS.includes(row.variant_id as VariantId)) {
      out[row.variant_id as VariantId] = row.count;
    }
  }
  return out;
}

/** Toggle vote. If user has voted -> un-votes (delta -1). Else votes (+1). Returns new count. */
export async function toggleVote(variantId: VariantId): Promise<number | null> {
  const sb = getSupabase();
  if (!sb) return null;

  const mine = readMineFromStorage();
  const hasVoted = mine.has(variantId);
  const delta = hasVoted ? -1 : 1;

  const { data, error } = await sb.rpc("bump_vote", {
    p_variant_id: variantId,
    p_delta: delta,
  });
  if (error) {
    console.error("toggleVote failed", error);
    return null;
  }

  if (hasVoted) mine.delete(variantId);
  else mine.add(variantId);
  writeMineToStorage(mine);

  return typeof data === "number" ? data : null;
}

export { isSupabaseConfigured };
