"use client";

import { getSupabase } from "./supabase";
import { DEFAULT_VARIANT_ID, VARIANT_IDS, type VariantId } from "@/variants/registry";

export async function fetchMainVariant(): Promise<VariantId> {
  const sb = getSupabase();
  if (!sb) return DEFAULT_VARIANT_ID;
  const { data, error } = await sb
    .from("site_config")
    .select("main_variant_id")
    .eq("id", 1)
    .maybeSingle();
  if (error || !data) return DEFAULT_VARIANT_ID;
  const id = data.main_variant_id as string;
  return VARIANT_IDS.includes(id as VariantId) ? (id as VariantId) : DEFAULT_VARIANT_ID;
}

export async function setMainVariant(variantId: VariantId): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  const { error } = await sb
    .from("site_config")
    .update({ main_variant_id: variantId, updated_at: new Date().toISOString() })
    .eq("id", 1);
  if (error) {
    console.error("setMainVariant failed", error);
    return false;
  }
  return true;
}
