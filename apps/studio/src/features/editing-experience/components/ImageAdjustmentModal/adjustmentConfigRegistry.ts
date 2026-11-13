import type { IsomerComponent } from "@opengovsg/isomer-components"

import type {
  AdjustmentConfig,
  AdjustmentPreviewState,
  AdjustmentRenderContext,
  AspectRatio,
  BuildSingleItemPreviewBlock,
} from "./AdjustmentConfig"

/** These component types never get image adjustment, by design. */
export const INTENTIONALLY_NOT_ADJUSTABLE = [
  "logocloud",
  "video",
  "navbar",
] as const

// Builds the InfoCards block the real-component preview renders: ONLY the card
// being edited, so it fills the tile (AdjustmentPreview forces the grid to one
// column). Drops the section's title/subtitle/link button. Keeps
// maxColumns/layout/variant so the card's per-breakpoint frame aspect (e.g.
// lg:aspect-square) matches the live page.
const buildSingleCardPreviewBlock: BuildSingleItemPreviewBlock = (
  block,
  card,
) => {
  if (block.type !== "infocards" || block.variant === "cardsWithoutImages")
    return undefined
  const editedCard = card as (typeof block.cards)[number]
  const preview: typeof block = {
    ...block,
    title: "",
    subtitle: undefined,
    url: undefined,
    label: undefined,
    cards: [editedCard],
  }
  return preview
}

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
  // Full-bleed with no CSS width cap, so warn against the 1280px
  // max-w-screen-xl content width.
  maxRenderedWidthPx: 1280,
  // lg:min-h-[31.25rem] is 500px, the image guidelines' minimum height for
  // this variant. The crop is free, so check width and height separately.
  maxRenderedHeightPx: 500,
  // Closest common ratio to the hero band at each breakpoint, 375×240,
  // 768×360 and 1280×500.
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

// Tier A — fixed 3:2 crop (aspect-[3/2]), no focal; the image crop is the same
// shape at every breakpoint. Like Contentpic, the crop is baked into the src so
// the renderer needs nothing at runtime. Risk-first per the orchestration plan:
// the floating text card overlaps the bottom of the image, so the real-component
// preview (which renders the actual overlapping card) is what lets an editor
// catch a subject hidden behind it. That overlap is breakpoint-specific — the
// card sits -1.5rem into a full-width image below md, -10rem at md, then
// -17.85rem over a 66.67%-wide image at lg — so preview all three regimes; a
// single desktop state would hide how much the card covers on mobile/tablet.
// The 3:2 aspectRatio is only the pre-measure flash guess (PreviewFrame measures
// the real height, which includes the overlapping card).
const HERO_FLOATING_CONFIG: AdjustmentConfig = {
  componentType: "hero:floating",
  imageField: "backgroundUrl",
  cropMode: "fixed",
  focalEnabled: false,
  lockedRatios: [{ width: 3, height: 2 }],
  // Full-width below lg (~1024px), 66.67% (~800px) at lg — the tablet regime
  // is the widest frame.
  maxRenderedWidthPx: 1024,
  previewStates: responsivePreviewStates({
    mobile: { width: 3, height: 2 },
    tablet: { width: 3, height: 2 },
    desktop: { width: 3, height: 2 },
  }),
  preUploadCopy:
    "Use a high-resolution image (at least 1500×1000px) with a 3:2 aspect ratio. Keep key subjects out of the bottom third — the text card floats over it.",
}

// Tier A — fixed 1:1 crop, no focal; crop is baked into the src like every
// other Tier A component. Blockquote renders the SAME 1:1 image two different
// shapes depending on the page's layout — a circle (rounded-full, every
// layout except homepage/notfound) or a square (homepage/notfound). The
// real-component preview renders at the page's own layout, so it shows the
// shape this page will publish without anything extra here.
const BLOCKQUOTE_CONFIG: AdjustmentConfig = {
  componentType: "blockquote",
  imageField: "imageSrc",
  cropMode: "fixed",
  focalEnabled: false,
  lockedRatios: [{ width: 1, height: 1 }],
  // Masked avatar: 240px on the homepage (w-60), 96px elsewhere — warn
  // against the larger.
  maxRenderedWidthPx: 240,
  previewStates: responsivePreviewStates({
    mobile: { width: 1, height: 1 },
    tablet: { width: 1, height: 1 },
    desktop: { width: 1, height: 1 },
  }),
  preUploadCopy:
    "Use a square (1:1) image, at least 240×240px. The subject should sit centered — this image is masked into a circle on most pages.",
}

// Tier C — InfoCards "cards with images". Per-card image cover-fit into a card
// whose aspect ratio swings across breakpoints (3:2 by default; some column
// counts override it at lg), so this is the Tier-B cover+focal pattern (free
// crop baked in, focal anchors the subject across the swing). Crop is always
// offered; focal is offered only under imageFit "cover" (isFocalApplicable) —
// under "contain" the image is letterboxed, so the focal control is hidden.
// The preview renders the edited card for real (via
// buildSingleItemPreviewBlock), so the real per-breakpoint frame shows without
// this config having to replicate it.
const INFOCARDS_WITH_IMAGES_CONFIG: AdjustmentConfig = {
  componentType: "infocards:cardsWithImages",
  imageField: "imageUrl",
  cropMode: "custom",
  focalEnabled: true,
  ownsImageFitField: true,
  // Card width depends on column count (1200px at 1 column down to ~260px at 4);
  // warn against a generous multi-column card width so the common 2–4 column
  // grids don't false-warn on perfectly sharp images.
  maxRenderedWidthPx: 640,
  // Image frame is 3:2 (cardImageContainer aspect-[3/2]) → ~427px tall at
  // 640px. Crop is free (custom), so height must be checked independently
  // of width.
  maxRenderedHeightPx: 427,
  buildSingleItemPreviewBlock: buildSingleCardPreviewBlock,
  // Only a pre-measure guess: PreviewFrame measures the real card's height.
  previewStates: responsivePreviewStates({
    mobile: { width: 3, height: 2 },
    tablet: { width: 3, height: 2 },
    desktop: { width: 3, height: 2 },
  }),
  preUploadCopy:
    "The card crops this image to fill its frame, and the frame's shape changes across screen sizes. Set a focal point so your key subject stays in view.",
}

// Tier C — InfoCards "cards with full images". Same conditional crop/focal as
// the default variant, but the image fills the whole card (square on mobile →
// 2:3 portrait at lg) with a dark bottom gradient the title sits over. The
// preview renders the real card, so the real gradient/title show directly.
const INFOCARDS_WITH_FULL_IMAGE_CONFIG: AdjustmentConfig = {
  componentType: "infocards:cardsWithFullImages",
  imageField: "imageUrl",
  cropMode: "custom",
  focalEnabled: true,
  ownsImageFitField: true,
  // Same column-dependent card width as cardsWithImages — warn against a
  // generous multi-column width (see that config).
  maxRenderedWidthPx: 640,
  // Full-image cards are square on mobile, portrait at lg (lg:aspect-[2/3]);
  // 640 is a conservative height representative (the square case at 640px).
  maxRenderedHeightPx: 640,
  // Renders the single card for real via buildSingleItemPreviewBlock.
  buildSingleItemPreviewBlock: buildSingleCardPreviewBlock,
  // Card is square up to lg, then 2:3 portrait at lg: square on mobile/tablet,
  // portrait on desktop.
  previewStates: responsivePreviewStates({
    mobile: { width: 1, height: 1 },
    tablet: { width: 1, height: 1 },
    desktop: { width: 2, height: 3 },
  }),
  preUploadCopy:
    "The card crops this image to fill its frame and overlays the title on a dark gradient at the bottom. Keep your key subject in the upper half and set a focal point to anchor it.",
}

// Native Image block (P2a) — free-form crop. Unlike every framed component, the
// native image renders at its own (now cropped) aspect ratio with no fixed
// frame, so the crop is unconstrained (custom) and there's no focal point to
// set — nothing cover-fits, so an anchor would have nothing to anchor against.
// The crop is baked into src; the real-component preview renders the actual
// Image block, so no skipRealComponentPreview. The image is the same shape at
// every breakpoint (it just scales), so the three breakpoints show the same crop
// at different widths — kept for a consistent Desktop/Tablet/Mobile set.
const IMAGE_CONFIG: AdjustmentConfig = {
  componentType: "image",
  imageField: "src",
  cropMode: "custom",
  focalEnabled: false,
  // Widest the native image renders: the content column is full-width (col-span-12)
  // just below the `lg` breakpoint, ~943px at a 1023px viewport (above `lg` it
  // narrows to col-span-9). Round up to 960 so a sharp image at that width doesn't
  // false-warn while genuinely soft crops below it still do.
  maxRenderedWidthPx: 960,
  // Free-form crop: no fixed ratio, so previews carry no aspectRatio — the
  // caption shows width only and the real render is measured.
  previewStates: [
    { id: "mobile", label: "Mobile", viewportWidth: 375 },
    { id: "tablet", label: "Tablet", viewportWidth: 768 },
    { id: "desktop", label: "Desktop", viewportWidth: 1280 },
  ],
  preUploadCopy:
    "You can crop this image to any shape. Use a high-resolution image so the area you keep stays sharp at the size it displays on your page.",
}

// ImageGallery (P2b) — array-nested, always letterboxed. Every gallery image
// renders object-contain in a fixed-height frame (main slideshow + square
// thumbnails), so nothing cover-fits: the crop only defines the region that is
// baked in and then letterboxed, and a focal anchor has nothing to anchor
// against (same as InfoCards under "Resize image to fit"). Array-nested, so the
// real component renders the WHOLE gallery, not the single image being edited —
// use the framed approximation with a contain preview fit. This enables cropping
// only; it does not add a cover/"Fill" display option (the frame still
// letterboxes), which would be a separate renderer + schema change.
const IMAGE_GALLERY_CONFIG: AdjustmentConfig = {
  componentType: "imagegallery",
  imageField: "src",
  cropMode: "custom",
  focalEnabled: false,
  // Main slideshow: full content column wide (~943px just below `lg`, round up to
  // 960) and a fixed 28.5rem = 456px tall, object-contain. Both axes are needed
  // because contain only upscales when the crop falls short on BOTH — so a wide
  // landscape or a tall portrait stays sharp and doesn't false-warn, while a
  // genuinely small crop still does (see computeLowResWarning).
  maxRenderedWidthPx: 960,
  maxRenderedHeightPx: 456,
  previewObjectFitFor: () => "contain",
  skipRealComponentPreview: true,
  // object-contain shows the whole image regardless of frame shape. The frame is
  // a fixed height (17rem mobile → 28.5rem from sm) over the content column, so it
  // grows wider as the viewport grows — the three states approximate that frame
  // shape per breakpoint (the image is letterboxed to fit either way).
  previewStates: responsivePreviewStates({
    mobile: { width: 5, height: 4 },
    tablet: { width: 3, height: 2 },
    desktop: { width: 2, height: 1 },
  }),
  preUploadCopy:
    "Gallery images are shown in full (letterboxed to fit the frame), never cropped to it. Crop here only to trim parts of the image you don't want to show.",
}

// resolveAdjustmentConfig matches these on `type:variant` or bare `type`,
// plus the image field name. The first match wins, so a `type:variant` entry
// must come before a bare `type` entry for the same type.
export const CONFIGS: AdjustmentConfig[] = [
  IMAGE_CONFIG,
  IMAGE_GALLERY_CONFIG,
  HERO_GRADIENT_CONFIG,
  HERO_LARGE_IMAGE_CONFIG,
  HERO_BLOCK_CONFIG,
  HERO_FLOATING_CONFIG,
  CONTENTPIC_CONFIG,
  INFOPIC_FULL_CONFIG,
  INFOPIC_CONFIG,
  BLOCKQUOTE_CONFIG,
  INFOCARDS_WITH_IMAGES_CONFIG,
  INFOCARDS_WITH_FULL_IMAGE_CONFIG,
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
