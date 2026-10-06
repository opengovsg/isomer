import type { AdjustmentConfig } from "./AdjustmentConfig"

// Narrow an unknown block to read its discriminators safely.
const asBlock = (block: unknown): { type?: string; variant?: string } =>
  typeof block === "object" && block !== null
    ? (block as { type?: string; variant?: string })
    : {}

// Tier B — full-bleed responsive gradient hero. Focal anchors the subject as the
// banner reshapes across breakpoints (proven in spike W0-S-F); crop is free
// (custom). The previewStates' aspect ratios approximate the hero band at each
// breakpoint (min-h 15/22.5/31.25rem over the viewport width) so the preview
// shows which axis the focal actually bites — the W0-S-F geometry finding: on a
// wide band the vertical focal moves the image, the horizontal barely does.
const HERO_GRADIENT_CONFIG: AdjustmentConfig = {
  componentType: "hero:gradient",
  tier: "B",
  cropMode: "custom",
  focalEnabled: true,
  previewStates: [
    {
      id: "mobile",
      label: "Mobile",
      viewportWidth: 375,
      aspectRatio: { width: 375, height: 240 },
    },
    {
      id: "tablet",
      label: "Tablet",
      viewportWidth: 768,
      aspectRatio: { width: 768, height: 360 },
    },
    {
      id: "desktop",
      label: "Desktop",
      viewportWidth: 1440,
      aspectRatio: { width: 1440, height: 500 },
    },
  ],
  scrims: [
    // Mirrors HeroGradient's left-to-right dark gradient so editors can judge
    // text contrast against the chosen crop/focal.
    {
      id: "gradient",
      className: "bg-gradient-to-r from-[rgba(0,0,0,85%)] to-[rgba(0,0,0,10%)]",
    },
  ],
}

// Tier A — fixed 5:6 crop (aspect-[5/6]), no focal. The crop is baked into the
// src, so the renderer needs nothing at runtime; the config only drives the
// editor's fixed-ratio crop UI.
const CONTENTPIC_CONFIG: AdjustmentConfig = {
  componentType: "contentpic",
  tier: "A",
  cropMode: "fixed",
  focalEnabled: false,
  lockedRatios: [{ width: 5, height: 6 }],
  previewStates: [
    {
      id: "desktop",
      label: "Desktop",
      viewportWidth: 200,
      aspectRatio: { width: 5, height: 6 },
    },
  ],
}

// Generic fallback for image fields not yet wired to a component-specific config
// (every component other than HeroGradient/Contentpic until its M2/M3 fan-out).
const GENERIC_CONFIG: AdjustmentConfig = {
  componentType: "generic",
  tier: "A",
  cropMode: "custom",
  focalEnabled: true,
  previewStates: [
    {
      id: "desktop",
      label: "Desktop",
      viewportWidth: 1240,
      aspectRatio: { width: 4, height: 3 },
    },
    {
      id: "mobile",
      label: "Mobile",
      viewportWidth: 360,
      aspectRatio: { width: 4, height: 3 },
    },
  ],
}

/**
 * Resolves the adjustment config for an image field, by the containing block's
 * discriminators. W0-G wires HeroGradient (Tier B) and Contentpic (Tier A);
 * every other component falls back to GENERIC_CONFIG until its fan-out task
 * (M2/M3) adds a matching entry here.
 */
export function resolveAdjustmentConfig(args: {
  block: unknown
  fieldName: string
}): AdjustmentConfig {
  const { type, variant } = asBlock(args.block)
  if (type === "hero" && variant === "gradient") return HERO_GRADIENT_CONFIG
  if (type === "contentpic") return CONTENTPIC_CONFIG
  return GENERIC_CONFIG
}
