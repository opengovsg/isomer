import type { IsomerComponent } from "@opengovsg/isomer-components"

import type {
  AdjustmentConfig,
  AdjustmentPreviewState,
  AdjustmentRenderContext,
  AspectRatio,
} from "./AdjustmentConfig"

/** These component types never get image adjustment, by design. */
export const INTENTIONALLY_NOT_ADJUSTABLE = [
  "logocloud",
  "video",
  "navbar",
] as const

// The three breakpoint widths every editor preview uses. Only the aspect
// ratio differs per component. A real-component preview uses the ratio as a
// first guess before it measures. A framed preview uses it as the tile shape.
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
  // Warn below the recommended 2560×1440 (16:9) upload in preUploadCopy. The
  // section is full-bleed with lg:min-h-[31.25rem] (500px). The crop is free,
  // so check width and height separately.
  maxRenderedWidthPx: 2560,
  maxRenderedHeightPx: 1440,
  // Closest common ratio to the hero band at each breakpoint, 375×240,
  // 768×360 and 1280×500.
  previewStates: responsivePreviewStates({
    mobile: { width: 16, height: 10 },
    tablet: { width: 2, height: 1 },
    desktop: { width: 5, height: 2 },
  }),
  preUploadCopy: "Recommended 2560 × 1440 px (16:9).",
  preUploadLinks: {
    guideLabel: "Hero banner",
    templateUrl: "/placeholder_no_image.png",
  },
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
  // Warn below the recommended 1280×860 (3:2) upload in preUploadCopy, not
  // the rendered frame (~960 wide, lg:min-h 500px). Crop is free (custom), so
  // height is checked too.
  maxRenderedWidthPx: 1280,
  maxRenderedHeightPx: 860,
  // Closest common ratio to each breakpoint's hero band (375×240→16:10,
  // 768×360→2:1, 1280×500→5:2); the real tile height is still measured.
  // These size the whole section, not the image column. Desktop 5:2 fits the
  // side-by-side layout. Below lg the text stacks above the 320px image band,
  // so the measured tile runs taller than 16:10 / 2:1 and grows on first
  // measure. That's expected: height depends on the editor's copy, so no
  // fixed ratio is exact, and nothing saved depends on the guess.
  previewStates: responsivePreviewStates({
    mobile: { width: 16, height: 10 },
    tablet: { width: 2, height: 1 },
    desktop: { width: 5, height: 2 },
  }),
  preUploadCopy:
    "Recommended 1280 × 860 px (3:2). Keep the main subject centred with space above and below, as phones show only the middle of the image.",
  // Same placeholder new blocks start with (public/placeholder_no_image.png).
  preUploadLinks: {
    guideLabel: "Hero banner",
    templateUrl: "/placeholder_no_image.png",
  },
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
  // Warn below the recommended 500×600 upload in preUploadCopy (the rendered
  // frame is only 200px wide, sm:w-[200px]). Height follows the locked 5:6.
  maxRenderedWidthPx: 500,
  // Contentpic stacks below `sm` and sits side by side from `sm` up, so
  // Mobile shows the stacked layout. The ratios are first guesses only.
  previewStates: responsivePreviewStates({
    mobile: { width: 4, height: 5 },
    tablet: { width: 2, height: 1 },
    desktop: { width: 2, height: 1 },
  }),
  preUploadCopy:
    "Recommended 500 × 600 px (5:6). Use a portrait image with space above the head.",
  preUploadLinks: {
    guideLabel: "Image with text",
    templateUrl: "/placeholder_no_image.png",
  },
}

// Tier B — Block Infopic: image in its own column beside the text. Registered
// under bare `infopic` (not `infopic:block`) because `variant` is optional and
// older blocks have none. Content-dependent cover: frame height varies with
// copy length, so preview aspect ratios are approximations.
const INFOPIC_CONFIG: AdjustmentConfig = {
  componentType: "infopic",
  imageField: "imageSrc",
  cropMode: "custom",
  focalEnabled: true,
  // Warn below the recommended 1280×860 (3:2) upload in preUploadCopy, not
  // the rendered frame (one lg:grid-cols-2 column, ~960 wide; image band
  // max-h-[400px] below lg). Crop is free (custom), so height is checked too.
  maxRenderedWidthPx: 1280,
  maxRenderedHeightPx: 860,
  // Closest common ratio to each breakpoint's frame (375×300→5:4,
  // 768×400→2:1, 1280×450→3:1); the real tile height is still measured.
  previewStates: responsivePreviewStates({
    mobile: { width: 5, height: 4 },
    tablet: { width: 2, height: 1 },
    desktop: { width: 3, height: 1 },
  }),
  preUploadCopy:
    "Recommended 1280 × 860 px (3:2). Keep the main subject centred and the description short.",
  preUploadLinks: {
    guideLabel: "Image with text",
    templateUrl: "/placeholder_no_image.png",
  },
}

// Tier B — Full Infopic: the image is a full-width CSS background behind the
// whole section, so its preview shapes differ from Block's.
const INFOPIC_FULL_CONFIG: AdjustmentConfig = {
  componentType: "infopic:full",
  imageField: "imageSrc",
  cropMode: "custom",
  focalEnabled: true,
  // Same recommended 1280×860 (3:2) upload as Block. The section floors at
  // 360px (min-h-[360px]) and grows with the copy.
  maxRenderedWidthPx: 1280,
  maxRenderedHeightPx: 860,
  // Rough section shapes at the 360px floor; the real tile height is measured.
  previewStates: responsivePreviewStates({
    mobile: { width: 1, height: 1 },
    tablet: { width: 2, height: 1 },
    desktop: { width: 3, height: 1 },
  }),
  preUploadCopy:
    "Recommended 1280 × 860 px (3:2). Keep the main subject centred and the description short.",
  preUploadLinks: {
    guideLabel: "Image with text",
    templateUrl: "/placeholder_no_image.png",
  },
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
  // Warn below the recommended 2560×1280 (2:1) upload in preUploadCopy. The
  // frame is 2:1 from md up (md:aspect-[2/1]). Crop is free (custom), so
  // height is checked too.
  maxRenderedWidthPx: 2560,
  maxRenderedHeightPx: 1280,
  previewStates: responsivePreviewStates({
    mobile: { width: 1, height: 1 },
    tablet: { width: 2, height: 1 },
    desktop: { width: 2, height: 1 },
  }),
  preUploadCopy:
    "Recommended 2560 × 1280 px (2:1). Keep one clear subject centred. On phones the sides are cut off.",
  // Same placeholder new blocks start with (public/placeholder_no_image.png).
  preUploadLinks: {
    guideLabel: "Hero banner",
    templateUrl: "/placeholder_no_image.png",
  },
}

// resolveAdjustmentConfig matches these on `type:variant` or bare `type`,
// plus the image field name. The first match wins, so a `type:variant` entry
// must come before a bare `type` entry for the same type.
export const CONFIGS: AdjustmentConfig[] = [
  HERO_GRADIENT_CONFIG,
  HERO_LARGE_IMAGE_CONFIG,
  HERO_BLOCK_CONFIG,
  CONTENTPIC_CONFIG,
  INFOPIC_FULL_CONFIG,
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
  // No match means not wired yet. The registry test asserts the deliberate
  // opt-outs.
  return CONFIGS.find(
    (c) =>
      (c.componentType === `${block.type}:${variant}` ||
        c.componentType === block.type) &&
      c.imageField === fieldName,
  )
}
