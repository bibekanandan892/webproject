import { notFound } from "next/navigation";
import { VariantHost } from "@/variants/VariantHost";
import { VARIANT_IDS, type VariantId, getVariant } from "@/variants/registry";

interface PageProps {
  params: Promise<{ variant: string }>;
}

export function generateStaticParams() {
  return VARIANT_IDS.map((variant) => ({ variant }));
}

export async function generateMetadata({ params }: PageProps) {
  const { variant } = await params;
  const v = getVariant(variant);
  if (!v) return { title: "Preview" };
  return {
    title: `${v.name} preview`,
    description: v.blurb,
  };
}

export default async function PreviewPage({ params }: PageProps) {
  const { variant } = await params;
  if (!VARIANT_IDS.includes(variant as VariantId)) {
    notFound();
  }
  return <VariantHost id={variant as VariantId} />;
}
