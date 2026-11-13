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

// Tier B — full-bleed responsive carousel hero. Each slide's backgroundUrl is
// rendered (object-cover) by the shared CarouselSlideImages, used by BOTH
// carousel layouts (block = half-width image panel at lg; gradient = full-bleed
// with a dark overlay). The editor resolves a single slide's backgroundUrl to
// the owning carousel block. The thresholds below are shared by both layouts and
// use the more generous full-bleed geometry (gradient, the widest the image ever
// renders) so a sharp image doesn't false-warn under either; only the preview
// shapes follow the block's carousel layout.
// Focal anchors the subject as the band reshapes across breakpoints; crop is
// free (custom), exactly like HERO_GRADIENT_CONFIG.
//
// Preview: skipRealComponentPreview — the carousel is an interactive client
// component that refuses to render below HERO_CAROUSEL_SLIDE_LIMITS.minItems (2)
// slides and rotates between them, so buildSingleItemPreviewBlock (which renders
// the whole block with every item) would show the full rotating carousel, not
// the single slide being edited. The framed approximation with the hero-band
// aspect ratios is the honest single-slide preview here (same reasoning as
// IMAGE_GALLERY_CONFIG's array-nested skip).
const heroCarouselConfig = (block: IsomerComponent): AdjustmentConfig => {
  const isBlockLayout =
    block.type === "hero" &&
    block.variant === "carousel" &&
    block.carousel?.layout === "block"
  // Slides use the same upload guidance and warning size as the standalone
  // hero variant their layout mirrors.
  const layoutConfig = isBlockLayout ? HERO_BLOCK_CONFIG : HERO_GRADIENT_CONFIG
  return {
    componentType: "hero:carousel",
    imageField: "backgroundUrl",
    cropMode: "custom",
    focalEnabled: true,
    maxRenderedWidthPx: layoutConfig.maxRenderedWidthPx,
    maxRenderedHeightPx: layoutConfig.maxRenderedHeightPx,
    // Framed preview, so these set the tile shape directly. Gradient (default):
    // closest common ratio to each hero band (375×240→16:10, 768×360→2:1,
    // 1280×500→5:2), as in HERO_GRADIENT_CONFIG. Block: imageColumn is h-80 below
    // lg and half-width at lg with min-h 500 (375×320→7:6, 768×320→12:5,
    // 640×500→5:4).
    previewStates: responsivePreviewStates(
      isBlockLayout
        ? {
            mobile: { width: 7, height: 6 },
            tablet: { width: 12, height: 5 },
            desktop: { width: 5, height: 4 },
          }
        : {
            mobile: { width: 16, height: 10 },
            tablet: { width: 2, height: 1 },
            desktop: { width: 5, height: 2 },
          },
    ),
    skipRealComponentPreview: true,
    preUploadCopy: layoutConfig.preUploadCopy,
    preUploadLinks: layoutConfig.preUploadLinks,
  }
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
  // Warn below the recommended 1920×1280 upload in preUploadCopy (the frame
  // is ~1024px wide at most). Height follows the locked 3:2.
  maxRenderedWidthPx: 1920,
  previewStates: responsivePreviewStates({
    mobile: { width: 3, height: 2 },
    tablet: { width: 3, height: 2 },
    desktop: { width: 3, height: 2 },
  }),
  preUploadCopy:
    "Recommended 1920 × 1280 px (3:2). The whole image shows. Keep faces away from the bottom-left, where the text card sits.",
  preUploadLinks: {
    guideLabel: "Hero banner",
    templateUrl: "/placeholder_no_image.png",
  },
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
  // Warn below the recommended 400×400 upload in preUploadCopy (the avatar
  // renders at 240px on the homepage, w-60, and 96px elsewhere).
  maxRenderedWidthPx: 400,
  previewStates: responsivePreviewStates({
    mobile: { width: 1, height: 1 },
    tablet: { width: 1, height: 1 },
    desktop: { width: 1, height: 1 },
  }),
  preUploadCopy:
    "Recommended 400 × 400 px (1:1). Use a square headshot with the face centred. It's shown as a circle.",
  preUploadLinks: {
    guideLabel: "Quote",
    templateUrl: "/placeholder_no_image.png",
  },
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
  // Warn below the recommended 1200×800 (3:2) upload in preUploadCopy. Cards
  // render 1200px wide at 1 column down to ~260px at 4. Crop is free (custom),
  // so height is checked too.
  maxRenderedWidthPx: 1200,
  maxRenderedHeightPx: 800,
  buildSingleItemPreviewBlock: buildSingleCardPreviewBlock,
  // Only a pre-measure guess: PreviewFrame measures the real card's height.
  previewStates: responsivePreviewStates({
    mobile: { width: 3, height: 2 },
    tablet: { width: 3, height: 2 },
    desktop: { width: 3, height: 2 },
  }),
  preUploadCopy:
    "Recommended 1200 × 800 px (3:2). Keep the main subject centred with space on all sides.",
  preUploadLinks: {
    guideLabel: "Cards",
    templateUrl: "/placeholder_no_image.png",
  },
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
  // Warn below the recommended 800×1200 (2:3) upload in preUploadCopy. Cards
  // are square on mobile and portrait at lg (lg:aspect-[2/3]).
  maxRenderedWidthPx: 800,
  maxRenderedHeightPx: 1200,
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
    "Recommended 800 × 1200 px (2:3). Keep the subject in the upper half, as the title covers the lower part.",
  preUploadLinks: {
    guideLabel: "Cards",
    templateUrl: "/placeholder_no_image.png",
  },
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
  // Warn below the recommended 1500px width in preUploadCopy (the content
  // column renders it ~960px wide at most). Any shape, so no height check.
  maxRenderedWidthPx: 1500,
  // Free-form crop: no fixed ratio, so previews carry no aspectRatio — the
  // caption shows width only and the real render is measured.
  previewStates: [
    { id: "mobile", label: "Mobile", viewportWidth: 375 },
    { id: "tablet", label: "Tablet", viewportWidth: 768 },
    { id: "desktop", label: "Desktop", viewportWidth: 1280 },
  ],
  preUploadCopy:
    "Recommended at least 1500 px wide, any shape. The whole image is shown, so nothing is cropped.",
  preUploadLinks: {
    guideLabel: "Image",
    templateUrl: "/placeholder_no_image.png",
  },
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
  // Warn below the recommended 1200×800 (3:2) upload in preUploadCopy. The
  // slideshow renders ~960 wide and 456px tall, object-contain.
  maxRenderedWidthPx: 1200,
  maxRenderedHeightPx: 800,
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
    "Recommended 1200 × 800 px (3:2). Use the same shape for every image. Captions cover the bottom.",
  preUploadLinks: {
    guideLabel: "Image gallery",
    templateUrl: "/placeholder_no_image.png",
  },
}

// Collection item thumbnail (`page.image`) — a page-level field, not a
// content-block field, so it has no block `type` discriminator for the
// registry to key off (see resolveAdjustmentConfig's isCollectionThumbnail
// branch). The same source image also feeds a homepage CollectionBlock
// embed, whose frame depends on the live collection item count at render
// time (3:2, or 2:1 at desktop for exactly 2 items) — genuinely unknowable
// here, and out of scope for this editor; the preview only reflects the
// collection's own index-page listing.
// That listing's frame IS knowable: the collection's index page already has
// a "Layout" setting (JsonFormsCollectionVariantControl, format
// "collection-variant") picking CollectionCard ("1-column", a fixed 200x160
// / 5:4 box) or BlogCard ("2-column", a fixed aspect-[2/1] box) — see
// CollectionResults.tsx. useAdjustmentConfigForField fetches that setting
// and passes it as `collectionVariant`, so the preview mimics every other
// component here: one resolved frame, no version picker. Unresolved
// (query still loading, or this control somehow renders outside a page
// editor) falls back to the schema's own "collection" (1-column) default.
// ChildrenPages was considered but ruled out: it only ever reads the
// immediate children of the page it's placed on, and a collection's items
// are children of the Collection resource, one level below that — so a
// ChildrenPages block can never reach an individual item's thumbnail (at
// most it would show the Collection's own page.image, a different field).
// cropMode is "custom" (not a locked ratio) and ownsImageFitField is set so
// editors can choose "Resize image to fit" (contain, no cropping) instead of
// the default cover crop — same fit/fill toggle InfoCards already offers,
// with focal hidden under "contain" for the same reason (nothing to anchor
// once the image is letterboxed). The real render context is a different
// page (the collection index) than the one being edited — skip the
// real-component preview in favour of the framed approximation, as
// ImageGallery does for the same reason.
const buildCollectionThumbnailConfig = (
  collectionVariant?: "collection" | "blog",
): AdjustmentConfig => {
  const isBlogVariant = collectionVariant === "blog"

  return {
    componentType: "collection:thumbnail",
    imageField: "src",
    cropMode: "custom",
    focalEnabled: true,
    ownsImageFitField: true,
    // Warn below the recommended 1200×900 (4:3) upload in preUploadCopy, for
    // both layouts (CollectionCard's 200×160 box, BlogCard's 2:1 frame).
    maxRenderedWidthPx: 1200,
    maxRenderedHeightPx: 900,
    skipRealComponentPreview: true,
    // Identical ratio at every breakpoint either way (CollectionCard's
    // `h-[160px] w-[200px]` and BlogCard's `aspect-[2/1]` both carry no
    // md:/lg: override), so all three preview states share one ratio.
    previewStates: isBlogVariant
      ? responsivePreviewStates({
          mobile: { width: 2, height: 1 },
          tablet: { width: 2, height: 1 },
          desktop: { width: 2, height: 1 },
        })
      : responsivePreviewStates({
          mobile: { width: 5, height: 4 },
          tablet: { width: 5, height: 4 },
          desktop: { width: 5, height: 4 },
        }),
    preUploadCopy:
      "Recommended 1200 × 900 px (4:3). Use one clear subject centred. It's shown as a small box or a wide strip.",
    preUploadLinks: {
      guideLabel: "thumbnails",
      templateUrl: "/placeholder_no_image.png",
    },
  }
}

// Every static config, matched by resolveAdjustmentConfig on
// `type:variant` (or bare `type`) plus the image field name. The collection
// thumbnail (no block `type`) and the hero carousel (preview shapes follow
// its layout) are resolved explicitly before this lookup. The first match
// wins, so a `type:variant` entry must come before a bare `type` entry for the
// same type.
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
  // Page-level thumbnail field (no block-type ancestor) on a confirmed
  // collection item — see buildCollectionThumbnailConfig. Checked before the
  // block-type lookup below since this field's host has no `type`
  // discriminator for that lookup to key off.
  if (args.context?.isCollectionThumbnail)
    return buildCollectionThumbnailConfig(args.context.collectionVariant)

  const { block, fieldName } = args
  if (!block) return undefined
  const variant =
    "variant" in block && typeof block.variant === "string"
      ? block.variant
      : undefined
  if (
    block.type === "hero" &&
    variant === "carousel" &&
    fieldName === "backgroundUrl"
  )
    return heroCarouselConfig(block)
  // No match means not wired yet. The registry test asserts the deliberate
  // opt-outs.
  return CONFIGS.find(
    (c) =>
      (c.componentType === `${block.type}:${variant}` ||
        c.componentType === block.type) &&
      c.imageField === fieldName,
  )
}
