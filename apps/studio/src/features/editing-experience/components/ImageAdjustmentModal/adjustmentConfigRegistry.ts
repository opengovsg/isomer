import type {
  AdjustmentConfig,
  AdjustmentPreviewState,
  AspectRatio,
} from "./AdjustmentConfig"

// Narrow an unknown block to read its discriminators safely.
const asBlock = (block: unknown): { type?: string; variant?: string } =>
  typeof block === "object" && block !== null ? block : {}

// Every Tier B config previews at the same three breakpoint viewport widths
// (mobile 375 / tablet 768 / desktop 1280); only the aspect-ratio guess differs
// per component, so declare just the ratios. The ratios are an initial guess —
// PreviewFrame measures the real rendered height — so they only need to be in
// the right ballpark for the pre-measure flash.
const responsivePreviewStates = (ratios: {
  mobile: AspectRatio
  tablet: AspectRatio
  desktop: AspectRatio
}): AdjustmentPreviewState[] => [
  {
    id: "mobile",
    label: "Mobile",
    viewportWidth: 375,
    aspectRatio: ratios.mobile,
  },
  {
    id: "tablet",
    label: "Tablet",
    viewportWidth: 768,
    aspectRatio: ratios.tablet,
  },
  {
    id: "desktop",
    label: "Desktop",
    viewportWidth: 1280,
    aspectRatio: ratios.desktop,
  },
]

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
  previewStates: responsivePreviewStates({
    mobile: { width: 375, height: 240 },
    tablet: { width: 768, height: 360 },
    desktop: { width: 1280, height: 500 },
  }),
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
  previewStates: responsivePreviewStates({
    mobile: { width: 375, height: 240 },
    tablet: { width: 768, height: 360 },
    desktop: { width: 1280, height: 500 },
  }),
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
  // Contentpic stacks (image above text) as a column below Tailwind `sm` (640px)
  // and switches to its real side-by-side row layout — image fixed at 200×240 —
  // at `sm` and up (`sm:flex-row`). Preview at exactly 640px so the frame shows
  // that true desktop row layout rather than the narrow mobile column a <640px
  // viewport would render; it's also the smallest faithful desktop width, which
  // keeps the image as large as possible once the frame is scaled down.
  previewStates: [
    {
      id: "desktop",
      label: "Desktop",
      viewportWidth: 640,
      // Rough landscape estimate for the pre-measure flash only.
      aspectRatio: { width: 640, height: 300 },
    },
  ],
}

// Tier B — responsive image with text. Content-dependent cover: frame height
// varies with copy length, so preview aspect ratios are approximations.
const INFOPIC_CONFIG: AdjustmentConfig = {
  componentType: "infopic",
  cropMode: "custom",
  focalEnabled: true,
  previewStates: responsivePreviewStates({
    mobile: { width: 375, height: 300 },
    tablet: { width: 768, height: 400 },
    desktop: { width: 1280, height: 450 },
  }),
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
  previewStates: responsivePreviewStates({
    mobile: { width: 1, height: 1 },
    tablet: { width: 2, height: 1 },
    desktop: { width: 2, height: 1 },
  }),
  preUploadCopy:
    "Use a high-resolution image (at least 1280×500px) with an aspect ratio between 3:2 and 2:1, key subjects centered with ample bleed.",
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
  if (type === "contentpic") return CONTENTPIC_CONFIG
  if (type === "infopic") return INFOPIC_CONFIG
  return undefined
}
