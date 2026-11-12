import type { IsomerComponent } from "@opengovsg/isomer-components"

import type {
  AdjustmentConfig,
  AdjustmentPreviewState,
  AdjustmentRenderContext,
  AspectRatio,
} from "./AdjustmentConfig"

/** Deliberate opt-outs: these component types will never have image adjustment, by design. */
export const INTENTIONALLY_NOT_ADJUSTABLE = [
  "logocloud",
  "video",
  "navbar",
] as const

// Standard Desktop/Tablet/Mobile preview set, shared by every component so all
// editor previews show the same three breakpoint viewport widths (mobile 375 /
// tablet 768 / desktop 1280); only the aspect ratio differs per component. For
// real-component previews the ratio is just a pre-measure flash guess
// (PreviewFrame measures the real rendered height); for framed previews
// (skipRealComponentPreview) it sets the tile's actual shape.
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
  imageField: "backgroundUrl",
  cropMode: "custom",
  focalEnabled: true,
  // Full-bleed; no CSS width cap. Warn against the 1280px content ceiling
  // (max-w-screen-xl) as a conservative "looks soft on desktop" floor.
  maxRenderedWidthPx: 1280,
  // lg:min-h-[31.25rem] (500px) — the hero band's actual minimum rendered
  // height, matching the Isomer image guidelines' 2560×500 minimum for this
  // variant. Crop is free (custom), so width and height can fall short
  // independently — both must be checked.
  maxRenderedHeightPx: 500,
  // Closest common ratio to each breakpoint's hero band (375×240→16:10,
  // 768×360→2:1, 1280×500→5:2); the real tile height is still measured.
  previewStates: responsivePreviewStates({
    mobile: { width: 16, height: 10 },
    tablet: { width: 2, height: 1 },
    desktop: { width: 5, height: 2 },
  }),
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
  imageField: "backgroundUrl",
  cropMode: "custom",
  focalEnabled: true,
  // Image band is half the viewport at lg (lg:w-1/2); ~960px on large desktop.
  maxRenderedWidthPx: 960,
  // lg:min-h-[31.25rem] (500px) on the image panel — same minimum height as
  // HeroGradient, matching the Isomer image guidelines' 1280×500 minimum for
  // this variant. Crop is free (custom), so height must be checked too.
  maxRenderedHeightPx: 500,
  // Closest common ratio to each breakpoint's hero band (375×240→16:10,
  // 768×360→2:1, 1280×500→5:2); the real tile height is still measured.
  previewStates: responsivePreviewStates({
    mobile: { width: 16, height: 10 },
    tablet: { width: 2, height: 1 },
    desktop: { width: 5, height: 2 },
  }),
  preUploadCopy:
    "Use a high-resolution image (at least 1280×500px) with an aspect ratio between 3:2 and 2:1, key subjects centered with ample bleed, and no text.",
}

// Tier A — fixed 5:6 crop (aspect-[5/6]), no focal. The crop is baked into the
// src, so the renderer needs nothing at runtime; the config only drives the
// editor's fixed-ratio crop UI.
const CONTENTPIC_CONFIG: AdjustmentConfig = {
  componentType: "contentpic",
  imageField: "imageSrc",
  cropMode: "fixed",
  focalEnabled: false,
  lockedRatios: [{ width: 5, height: 6 }],
  // Fixed 200px-wide frame from sm up (sm:w-[200px]).
  maxRenderedWidthPx: 200,
  // Contentpic stacks (image above text) as a column below Tailwind `sm` (640px)
  // and switches to its side-by-side row layout at `sm` and up (`sm:flex-row`),
  // so Mobile (375) shows the stacked layout while Tablet/Desktop show the row.
  // Aspect ratios are pre-measure flash guesses only (PreviewFrame measures the
  // real rendered height).
  previewStates: responsivePreviewStates({
    mobile: { width: 4, height: 5 },
    tablet: { width: 2, height: 1 },
    desktop: { width: 2, height: 1 },
  }),
  preUploadCopy:
    "Use a high-resolution image (at least 400×480px) with a 5:6 (portrait) aspect ratio. Keep the key subject centered — the image is cropped to a fixed portrait frame beside your text.",
}

// Tier B — responsive image with text. Content-dependent cover: frame height
// varies with copy length, so preview aspect ratios are approximations.
const INFOPIC_CONFIG: AdjustmentConfig = {
  componentType: "infopic",
  imageField: "imageSrc",
  cropMode: "custom",
  focalEnabled: true,
  // One of two columns at lg (lg:grid-cols-2); ~960px on large desktop.
  maxRenderedWidthPx: 960,
  // object-cover frame; image band is capped at 400px (max-h-[400px]) and the
  // container floors at 360px — 400 is a conservative height floor. Crop is
  // free (custom), so height must be checked independently of width.
  maxRenderedHeightPx: 400,
  // Closest common ratio to each breakpoint's frame (375×300→5:4,
  // 768×400→2:1, 1280×450→3:1); the real tile height is still measured.
  previewStates: responsivePreviewStates({
    mobile: { width: 5, height: 4 },
    tablet: { width: 2, height: 1 },
    desktop: { width: 3, height: 1 },
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
  imageField: "backgroundUrl",
  cropMode: "custom",
  focalEnabled: true,
  // Full-bleed; warn against the 1280px content ceiling (same as hero:gradient).
  maxRenderedWidthPx: 1280,
  // Widest frame is 2:1 from md up (md:aspect-[2/1]) → 640px tall at 1280px.
  // Crop is free (custom), so height must be checked independently of width.
  maxRenderedHeightPx: 640,
  previewStates: responsivePreviewStates({
    mobile: { width: 1, height: 1 },
    tablet: { width: 2, height: 1 },
    desktop: { width: 2, height: 1 },
  }),
  preUploadCopy:
    "Use a high-resolution image (at least 1280×500px) with an aspect ratio between 3:2 and 2:1, key subjects centered with ample bleed.",
}

// Every static config, matched by resolveAdjustmentConfig on
// `type:variant` (or bare `type`) plus the image field name.
export const CONFIGS: AdjustmentConfig[] = [
  HERO_GRADIENT_CONFIG,
  HERO_LARGE_IMAGE_CONFIG,
  HERO_BLOCK_CONFIG,
  CONTENTPIC_CONFIG,
  INFOPIC_CONFIG,
]

/**
 * Resolves the adjustment config for an image field, by the containing block's
 * discriminators. Returns undefined for components not yet wired — the entry
 * point hides the "Adjust image" action rather than offering a dead modal.
 */
export function resolveAdjustmentConfig(args: {
  block: IsomerComponent | undefined
  fieldName: string
  context?: AdjustmentRenderContext
}): AdjustmentConfig | undefined {
  const { block, fieldName } = args
  if (!block) return undefined
  const variant =
    "variant" in block && typeof block.variant === "string"
      ? block.variant
      : undefined
  // absence = not integrated (optional by design); deliberate opt-outs are asserted in the registry test.
  return CONFIGS.find(
    (c) =>
      (c.componentType === `${block.type}:${variant}` ||
        c.componentType === block.type) &&
      c.imageField === fieldName,
  )
}
