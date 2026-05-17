import type { ComponentType } from "react";
import { TerminalDarkVariant } from "./terminal-dark/Variant";
import { KobwebClassicVariant } from "./kobweb-classic/Variant";
import { BentoIosVariant } from "./bento-ios/Variant";
import { EditorialSerifVariant } from "./editorial-serif/Variant";
import { LiquidGlassVariant } from "./liquid-glass/Variant";
import { SpatialThreeDVariant } from "./spatial-3d/Variant";

export type VariantId =
  | "terminal-dark"
  | "kobweb-classic"
  | "bento-ios"
  | "editorial-serif"
  | "liquid-glass"
  | "spatial-3d";

export interface VariantMeta {
  id: VariantId;
  name: string;
  blurb: string;
  accent: string;
  Component: ComponentType;
  fontClass: string;
}

export const VARIANTS: readonly VariantMeta[] = [
  {
    id: "terminal-dark",
    name: "Terminal Dark",
    blurb: "brittanychiang / linear inspired — calm cyan accent on aurora night",
    accent: "#64FFDA",
    Component: TerminalDarkVariant,
    fontClass: "font-geist",
  },
  {
    id: "kobweb-classic",
    name: "Kobweb Classic",
    blurb: "faithful recreation of the original bibekananda.in — teal + Roboto + cream",
    accent: "#00A78E",
    Component: KobwebClassicVariant,
    fontClass: "font-roboto",
  },
  {
    id: "bento-ios",
    name: "Bento iOS",
    blurb: "Apple iOS-26 chunky rounded bento grid",
    accent: "#F5A524",
    Component: BentoIosVariant,
    fontClass: "font-geist",
  },
  {
    id: "editorial-serif",
    name: "Editorial Serif",
    blurb: "NYT-tech magazine — Fraunces, warm cream, burnt orange",
    accent: "#C04A2B",
    Component: EditorialSerifVariant,
    fontClass: "font-fraunces",
  },
  {
    id: "liquid-glass",
    name: "Liquid Glass",
    blurb: "iOS 26 / Vision Pro — drifting mesh + frosted cards with mouse tilt",
    accent: "#C7B9FF",
    Component: LiquidGlassVariant,
    fontClass: "font-inter",
  },
  {
    id: "spatial-3d",
    name: "Spatial 3D",
    blurb: "WebGL starfield + floating wireframe shapes, scroll spins the scene",
    accent: "#5CC9FF",
    Component: SpatialThreeDVariant,
    fontClass: "font-geist",
  },
] as const;

export const VARIANT_IDS: readonly VariantId[] = VARIANTS.map((v) => v.id);

export const DEFAULT_VARIANT_ID: VariantId = "terminal-dark";

export function getVariant(id: string): VariantMeta | undefined {
  return VARIANTS.find((v) => v.id === id);
}
