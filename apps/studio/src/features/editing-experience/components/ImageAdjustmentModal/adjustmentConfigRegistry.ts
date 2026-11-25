import type { IsomerComponent } from "@opengovsg/isomer-components"
import { createElement } from "react"

import type {
  AdjustmentConfig,
  AdjustmentPreviewState,
  AdjustmentRenderContext,
  AspectRatio,
  BuildAdjustmentPreview,
} from "./AdjustmentConfig"
import { withAdjustedImage } from "./AdjustmentConfig"

/** These component types never get image adjustment, by design. */
export const INTENTIONALLY_NOT_ADJUSTABLE = [
  "logocloud",
  "video",
  "navbar",
] as const

// Builds the InfoCards preview: ONLY the card being edited, in a one-column
// grid so it fills the tile. Drops the section's title/subtitle/link button.
// Keeps maxColumns/layout/variant so the card's per-breakpoint frame aspect
// (e.g. lg:aspect-square) matches the live page.
const buildSingleCardPreview: BuildAdjustmentPreview = (ctx) => {
  const { block } = ctx
  if (block.type !== "infocards" || block.variant === "cardsWithoutImages")
    return undefined
  // The card reads `imageFit`, so the preview follows the modal's Fit/Fill
  // toggle.
  const editedCard = {
    ...withAdjustedImage(ctx),
    imageFit: ctx.objectFit,
  } as (typeof block.cards)[number]
  const preview: typeof block = {
    ...block,
    title: "",
    subtitle: undefined,
    url: undefined,
    label: undefined,
    cards: [editedCard],
  }
  return {
    component: preview,
    // `auto-rows-max` is the grid's class in InfoCards/common.ts.
    wrapPreview: (children) =>
      createElement(
        "div",
        { className: "[&_.auto-rows-max]:!grid-cols-1" },
        children,
      ),
  }
}

// Blockquote hides its image when the alt text is empty. Fill it in for the
// preview only, so the image still shows.
const buildBlockquotePreview: BuildAdjustmentPreview = (ctx) => {
  const alt = ctx.fieldHost.imageAlt
  return {
    component: {
      ...withAdjustedImage(ctx),
      imageAlt:
        typeof alt === "string" && alt.length > 0 ? alt : "Preview image",
    } as unknown as IsomerComponent,
  }
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
  // Warn below the recommended 1920×1080 upload in preUploadCopy. The crop is
  // free, so check width and height separately.
  maxRenderedWidthPx: 1920,
  maxRenderedHeightPx: 1080,
  // Closest common ratio to the hero band at each breakpoint, 375×240,
  // 768×360 and 1280×500.
  previewStates: responsivePreviewStates({
    mobile: { width: 16, height: 10 },
    tablet: { width: 2, height: 1 },
    desktop: { width: 5, height: 2 },
  }),
  preUploadCopy: "Recommended 1920 × 1080 px.",
  preUploadLinks: {
    guideLabel: "hero banner",
    guideUrl:
      "https://support.isomer.gov.sg/en/articles/10390602-editing-your-hero-banner",
    templateUrl:
      "https://isomer-user-content.by.gov.sg/Studio/Isomer%20-%20Hero%20banner%20Gradient%20%C2%B7%201920%C3%971080.png?original=true",
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
  // Warn below the recommended 1280×860 upload in preUploadCopy. Crop is free
  // (custom), so height is checked too.
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
  preUploadCopy: "Recommended 1280 × 860 px.",
  preUploadLinks: {
    guideLabel: "hero banner",
    guideUrl:
      "https://support.isomer.gov.sg/en/articles/10390602-editing-your-hero-banner",
    templateUrl:
      "https://isomer-user-content.by.gov.sg/Studio/Isomer%20-%20Hero%20banner%20Block%20%C2%B7%201280%C3%97860.png?original=true",
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
  // Warn below the recommended 600×720 upload in preUploadCopy. Height follows
  // the locked 5:6.
  maxRenderedWidthPx: 600,
  // Contentpic stacks below `sm` and sits side by side from `sm` up, so
  // Mobile shows the stacked layout. The ratios are first guesses only.
  previewStates: responsivePreviewStates({
    mobile: { width: 4, height: 5 },
    tablet: { width: 2, height: 1 },
    desktop: { width: 2, height: 1 },
  }),
  preUploadCopy: "Recommended 600 × 720 px.",
  preUploadLinks: {
    guideLabel: "image with text",
    guideUrl:
      "https://support.isomer.gov.sg/en/articles/10425941-image-with-text",
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
  // Warn below the recommended 1280×860 upload in preUploadCopy. Crop is free
  // (custom), so height is checked too.
  maxRenderedWidthPx: 1280,
  maxRenderedHeightPx: 860,
  // Closest common ratio to each breakpoint's frame (375×300→5:4,
  // 768×400→2:1, 1280×450→3:1); the real tile height is still measured.
  previewStates: responsivePreviewStates({
    mobile: { width: 5, height: 4 },
    tablet: { width: 2, height: 1 },
    desktop: { width: 3, height: 1 },
  }),
  preUploadCopy: "Recommended 1280 × 860 px.",
  preUploadLinks: {
    guideLabel: "image with text",
    guideUrl:
      "https://support.isomer.gov.sg/en/articles/18459544-image-with-text-homepage",
    templateUrl:
      "https://isomer-user-content.by.gov.sg/Studio/Isomer%20-%20Image%20with%20text%20%28homepage%29%20%C2%B7%201280%C3%97860.png?original=true",
  },
}

// Tier B — Full Infopic: the image is a full-width CSS background behind the
// whole section, so its preview shapes differ from Block's.
const INFOPIC_FULL_CONFIG: AdjustmentConfig = {
  componentType: "infopic:full",
  imageField: "imageSrc",
  cropMode: "custom",
  focalEnabled: true,
  // Same recommended 1280×860 upload as Block.
  maxRenderedWidthPx: 1280,
  maxRenderedHeightPx: 860,
  // Rough section shapes at the 360px floor; the real tile height is measured.
  previewStates: responsivePreviewStates({
    mobile: { width: 1, height: 1 },
    tablet: { width: 2, height: 1 },
    desktop: { width: 3, height: 1 },
  }),
  preUploadCopy: "Recommended 1280 × 860 px.",
  preUploadLinks: {
    guideLabel: "image with text",
    guideUrl:
      "https://support.isomer.gov.sg/en/articles/18459544-image-with-text-homepage",
    templateUrl:
      "https://isomer-user-content.by.gov.sg/Studio/Isomer%20-%20Image%20with%20text%20%28homepage%29%20%C2%B7%201280%C3%97860.png?original=true",
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
  // Warn below the recommended 1920×960 upload in preUploadCopy. Crop is free
  // (custom), so height is checked too.
  maxRenderedWidthPx: 1920,
  maxRenderedHeightPx: 960,
  previewStates: responsivePreviewStates({
    mobile: { width: 1, height: 1 },
    tablet: { width: 2, height: 1 },
    desktop: { width: 2, height: 1 },
  }),
  preUploadCopy: "Recommended 1920 × 960 px.",
  preUploadLinks: {
    guideLabel: "hero banner",
    guideUrl:
      "https://support.isomer.gov.sg/en/articles/10390602-editing-your-hero-banner",
    templateUrl:
      "https://isomer-user-content.by.gov.sg/Studio/Isomer%20-%20Hero%20banner%20Large%20image%20%C2%B7%201920%C3%97960.png?original=true",
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
  // Warn below the recommended 1500×1000 upload in preUploadCopy. Height
  // follows the locked 3:2.
  maxRenderedWidthPx: 1500,
  previewStates: responsivePreviewStates({
    mobile: { width: 3, height: 2 },
    tablet: { width: 3, height: 2 },
    desktop: { width: 3, height: 2 },
  }),
  preUploadCopy: "Recommended 1500 × 1000 px.",
  preUploadLinks: {
    guideLabel: "hero banner",
    guideUrl:
      "https://support.isomer.gov.sg/en/articles/10390602-editing-your-hero-banner",
    templateUrl:
      "https://isomer-user-content.by.gov.sg/Studio/Isomer%20-%20Hero%20banner%20Floating%20%C2%B7%201500%C3%971000.png?original=true",
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
  // Warn below the recommended 400×400 upload in preUploadCopy. Height follows
  // the locked 1:1.
  maxRenderedWidthPx: 400,
  buildPreview: buildBlockquotePreview,
  previewStates: responsivePreviewStates({
    mobile: { width: 1, height: 1 },
    tablet: { width: 1, height: 1 },
    desktop: { width: 1, height: 1 },
  }),
  preUploadCopy: "Recommended 400 × 400 px.",
  preUploadLinks: {
    guideLabel: "quote",
    guideUrl: "https://support.isomer.gov.sg/en/articles/18459513-quote",
    templateUrl:
      "https://isomer-user-content.by.gov.sg/Studio/Isomer%20-%20Quote%20%C2%B7%20400%C3%97400.png?original=true",
  },
}

// Tier C — InfoCards "cards with images". Per-card image cover-fit into a card
// whose aspect ratio swings across breakpoints (3:2 by default; some column
// counts override it at lg), so this is the Tier-B cover+focal pattern (free
// crop baked in, focal anchors the subject across the swing). Crop is always
// offered; focal is offered only under imageFit "cover" (isFocalApplicable) —
// under "contain" the image is letterboxed, so the focal control is hidden.
// The preview renders the edited card for real (via buildSingleCardPreview), so the real per-breakpoint frame shows without
// this config having to replicate it.
const INFOCARDS_WITH_IMAGES_CONFIG: AdjustmentConfig = {
  componentType: "infocards:cardsWithImages",
  imageField: "imageUrl",
  cropMode: "custom",
  focalEnabled: true,
  ownsImageFitField: true,
  // Warn below the recommended 800×533 upload in preUploadCopy. Crop is free
  // (custom), so height is checked too.
  maxRenderedWidthPx: 800,
  maxRenderedHeightPx: 533,
  buildPreview: buildSingleCardPreview,
  // Only a pre-measure guess: PreviewFrame measures the real card's height.
  previewStates: responsivePreviewStates({
    mobile: { width: 3, height: 2 },
    tablet: { width: 3, height: 2 },
    desktop: { width: 3, height: 2 },
  }),
  preUploadCopy: "Recommended 800 × 533 px.",
  preUploadLinks: {
    guideLabel: "cards",
    guideUrl: "https://support.isomer.gov.sg/en/articles/10425947-cards",
    templateUrl:
      "https://isomer-user-content.by.gov.sg/Studio/Isomer%20-%20Cards%20with%20images%20%C2%B7%20800%C3%97533.png?original=true",
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
  // Warn below the recommended 800×1200 upload in preUploadCopy. Crop is free
  // (custom), so height is checked too.
  maxRenderedWidthPx: 800,
  maxRenderedHeightPx: 1200,
  // Renders the single card for real.
  buildPreview: buildSingleCardPreview,
  // Card is square up to lg, then 2:3 portrait at lg: square on mobile/tablet,
  // portrait on desktop.
  previewStates: responsivePreviewStates({
    mobile: { width: 1, height: 1 },
    tablet: { width: 1, height: 1 },
    desktop: { width: 2, height: 3 },
  }),
  preUploadCopy: "Recommended 800 × 1200 px.",
  preUploadLinks: {
    guideLabel: "cards",
    guideUrl: "https://support.isomer.gov.sg/en/articles/10425947-cards",
    templateUrl:
      "https://isomer-user-content.by.gov.sg/Studio/Isomer%20-%20Cards%20with%20full%20images%20%C2%B7%20800%C3%971200.png?original=true",
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
  // Blur warning follows the recommended upload width shown in the banner.
  maxRenderedWidthPx: 1280,
  // Free-form crop: no fixed ratio, so previews carry no aspectRatio — the
  // caption shows width only and the real render is measured.
  previewStates: [
    { id: "mobile", label: "Mobile", viewportWidth: 375 },
    { id: "tablet", label: "Tablet", viewportWidth: 768 },
    { id: "desktop", label: "Desktop", viewportWidth: 1280 },
  ],
  preUploadCopy: "Recommended at least 1280 px wide, any height.",
  preUploadLinks: {
    guideLabel: "image",
    guideUrl: "https://support.isomer.gov.sg/en/articles/10425935-images",
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
  // Blur warning follows the recommended upload size shown in the banner.
  maxRenderedWidthPx: 960,
  maxRenderedHeightPx: 640,
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
  preUploadCopy: "Recommended 960 × 640 px.",
  preUploadLinks: {
    guideLabel: "image gallery",
    guideUrl:
      "https://support.isomer.gov.sg/en/articles/12129003-image-gallery",
  },
}

// Collection item thumbnail (`page.image`). It is a page-level field with no
// block type, so resolveAdjustmentConfig handles it before the block lookup.
// The preview shows the collection's own listing only: a 5:4 CollectionCard
// for the "collection" layout, a 2:1 BlogCard for "blog". The homepage
// CollectionBlock frame depends on the live item count, so it is not previewed.
// The listing renders on a different page, so this skips the real-component
// preview like ImageGallery does. Fit and fill work as on InfoCards.
const COLLECTION_THUMBNAIL_GUIDE_LINK = {
  guideLabel: "thumbnail",
  guideUrl:
    "https://support.isomer.gov.sg/en/articles/18459803-managing-collection-thumbnails",
}

const buildCollectionThumbnailConfig = (
  collectionVariant: "collection" | "blog" | "pending" = "pending",
): AdjustmentConfig => {
  const base = {
    componentType: "collection:thumbnail",
    imageField: "src",
    cropMode: "custom",
    focalEnabled: true,
    ownsImageFitField: true,
    skipRealComponentPreview: true,
  } as const

  // The parent's layout isn't known yet (still loading, or the lookup
  // failed), so there is no frame to show without guessing one that might not
  // match the real card. An empty previewStates renders "Preview unavailable".
  // The recommended size is also layout-specific, so it's withheld too.
  if (collectionVariant === "pending") {
    return { ...base, previewStates: [] }
  }

  const isBlogVariant = collectionVariant === "blog"

  return {
    ...base,
    // Warn below the recommended size in preUploadCopy, which differs by
    // layout (CollectionCard list vs BlogCard).
    maxRenderedWidthPx: isBlogVariant ? 640 : 400,
    maxRenderedHeightPx: 320,
    // Neither card changes ratio across breakpoints, so all three preview
    // states share one.
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
    preUploadCopy: isBlogVariant
      ? "Recommended 640 × 320 px."
      : "Recommended 400 × 320 px.",
    preUploadLinks: COLLECTION_THUMBNAIL_GUIDE_LINK,
  }
}

// Static configs. resolveAdjustmentConfig matches on `type:variant` or bare
// `type`, plus the image field name. The first match wins, so list a
// `type:variant` entry before the bare `type` one.
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
  // The collection thumbnail has no block type, so resolve it before the
  // block lookup.
  if (args.context?.isCollectionThumbnail)
    return buildCollectionThumbnailConfig(args.context.collectionVariant)

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
