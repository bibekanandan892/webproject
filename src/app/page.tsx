"use client";

import { useEffect, useState } from "react";
import { VariantHost } from "@/variants/VariantHost";
import { DEFAULT_VARIANT_ID, type VariantId } from "@/variants/registry";
import { fetchMainVariant } from "@/lib/main-variant";

export default function Home() {
  const [variantId, setVariantId] = useState<VariantId>(DEFAULT_VARIANT_ID);

  useEffect(() => {
    let cancelled = false;
    fetchMainVariant().then((id) => {
      if (!cancelled) setVariantId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return <VariantHost id={variantId} />;
}
