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
      viewportWidth: 1280,
      aspectRatio: { width: 1280, height: 500 },
    },
  ],
  // Mirrors HeroGradient's left-to-right dark gradient so editors can judge
  // text contrast against the chosen crop/focal.
  scrim: {
    id: "gradient",
    className: "bg-gradient-to-r from-[rgba(0,0,0,85%)] to-[rgba(0,0,0,10%)]",
  },
  preUploadCopy:
    "Use a high-resolution image (at least 2560×500px) with an aspect ratio between 3:2 and 2:1, key subjects centered with ample bleed, and no text — this variant adds a gradient overlay.",
}

// Tier B — responsive layout that STACKS (text, then the 320px image band)
// below lg (1024px), switching to side-by-side only at lg and up. The
// previewStates' aspect ratios are only an initial guess shown before
// PreviewFrame measures the real rendered height (which includes the full
// stacked text block on mobile/tablet, not just the image band) — matching
// HeroGradient's own min-h scale (15/22.5/31.25rem), since both use the same
// Tailwind breakpoints for their section's min-height.
const HERO_BLOCK_CONFIG: AdjustmentConfig = {
  componentType: "hero:block",
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
      viewportWidth: 1280,
      aspectRatio: { width: 1280, height: 500 },
    },
  ],
  preUploadCopy:
    "Use a high-resolution image (at least 1280×500px) with an aspect ratio between 3:2 and 2:1, key subjects centered with ample bleed, and no text.",
}

// Tier A — fixed 5:6 crop (aspect-[5/6]), no focal. The crop is baked into the
// src, so the renderer needs nothing at runtime; the config only drives the
// editor's fixed-ratio crop UI.
const CONTENTPIC_CONFIG: AdjustmentConfig = {
  componentType: "contentpic",
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

// Tier B — responsive image with text. Content-dependent cover: frame height
// varies with copy length, so preview aspect ratios are approximations.
const INFOPIC_CONFIG: AdjustmentConfig = {
  componentType: "infopic",
  cropMode: "custom",
  focalEnabled: true,
  previewStates: [
    {
      id: "mobile",
      label: "Mobile",
      viewportWidth: 375,
      aspectRatio: { width: 375, height: 300 },
    },
    {
      id: "tablet",
      label: "Tablet",
      viewportWidth: 768,
      aspectRatio: { width: 768, height: 400 },
    },
    {
      id: "desktop",
      label: "Desktop",
      viewportWidth: 1280,
      aspectRatio: { width: 1280, height: 450 },
    },
  ],
  preUploadCopy:
    "Use a high-resolution image (at least 1280×500px). Place the key subject on the side matching where the image sits (left or right) rather than centering it.",
}

// Tier B — responsive full-bleed image hero with the largest aspect-ratio swing
// of any Hero variant (aspect-square below md, md:aspect-[2/1] from md/768 up).
// Focal anchors the subject across this extreme swing; crop is free (custom).
// md is 768, so the tablet breakpoint already sits in the 2:1 regime — only
// mobile (375, below md) gets the square guess.
const HERO_LARGE_IMAGE_CONFIG: AdjustmentConfig = {
  componentType: "hero:largeImage",
  cropMode: "custom",
  focalEnabled: true,
  previewStates: [
    {
      id: "mobile",
      label: "Mobile",
      viewportWidth: 375,
      aspectRatio: { width: 1, height: 1 },
    },
    {
      id: "tablet",
      label: "Tablet",
      viewportWidth: 768,
      aspectRatio: { width: 2, height: 1 },
    },
    {
      id: "desktop",
      label: "Desktop",
      viewportWidth: 1280,
      aspectRatio: { width: 2, height: 1 },
    },
  ],
  preUploadCopy:
    "Use a high-resolution image (at least 1280×500px) with an aspect ratio between 3:2 and 2:1, key subjects centered with ample bleed.",
}

// Tier A — fixed 3:2 crop (aspect-[3/2]), no focal; same shape at every
// breakpoint (only the frame's width changes at lg, never the ratio). Like
// Contentpic, the crop is baked into the src so the renderer needs nothing at
// runtime. Risk-first per the orchestration plan: the floating text card
// overlaps the bottom of the image, so the real-component preview (which
// renders the actual overlapping card) is what lets an editor catch a subject
// hidden behind it — nothing extra is needed here for that to work.
const HERO_FLOATING_CONFIG: AdjustmentConfig = {
  componentType: "hero:floating",
  cropMode: "fixed",
  focalEnabled: false,
  lockedRatios: [{ width: 3, height: 2 }],
  previewStates: [
    {
      id: "desktop",
      label: "Desktop",
      viewportWidth: 1280,
      aspectRatio: { width: 3, height: 2 },
    },
  ],
  preUploadCopy:
    "Use a high-resolution image (at least 1500×1000px) with a 3:2 aspect ratio. Keep key subjects out of the bottom third — the text card floats over it.",
}

// Tier A — fixed 1:1 crop, no focal; crop is baked into the src like every
// other Tier A component. Blockquote renders the SAME 1:1 image two different
// shapes depending on the page's layout — a circle (rounded-full, every
// layout except homepage/notfound) or a square (homepage) — so both are
// previewed, each forcing its own `layout` on the shared real-component
// preview (see AdjustmentPreview's per-state layout override) rather than
// relying on a breakpoint/viewport difference.
const BLOCKQUOTE_CONFIG: AdjustmentConfig = {
  componentType: "blockquote",
  cropMode: "fixed",
  focalEnabled: false,
  lockedRatios: [{ width: 1, height: 1 }],
  previewStates: [
    {
      id: "circle",
      label: "Circle (content pages)",
      layout: "content",
      viewportWidth: 768,
      aspectRatio: { width: 1, height: 1 },
    },
    {
      id: "square",
      label: "Square (homepage)",
      layout: "homepage",
      viewportWidth: 768,
      aspectRatio: { width: 1, height: 1 },
    },
  ],
  preUploadCopy:
    "Use a square (1:1) image, at least 240×240px. The subject should sit centered — this image is masked into a circle on most pages.",
}

/**
 * Resolves the adjustment config for an image field, by the containing block's
 * discriminators. Returns undefined for components not yet wired — the entry
 * point hides the "Adjust image" action rather than offering a dead modal.
 */
export function resolveAdjustmentConfig(args: {
  block: unknown
  fieldName: string
}): AdjustmentConfig | undefined {
  const { type, variant } = asBlock(args.block)
  if (type === "hero" && variant === "gradient") return HERO_GRADIENT_CONFIG
  if (type === "hero" && variant === "largeImage")
    return HERO_LARGE_IMAGE_CONFIG
  if (type === "hero" && variant === "block") return HERO_BLOCK_CONFIG
  if (type === "hero" && variant === "floating") return HERO_FLOATING_CONFIG
  if (type === "contentpic") return CONTENTPIC_CONFIG
  if (type === "infopic") return INFOPIC_CONFIG
  if (type === "blockquote") return BLOCKQUOTE_CONFIG
  return undefined
}
