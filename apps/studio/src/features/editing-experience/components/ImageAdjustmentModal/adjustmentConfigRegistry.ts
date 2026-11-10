import type {
  IsomerComponent,
  IsomerPageLayoutType,
} from "@opengovsg/isomer-components"
import { IMAGE_FIT } from "@opengovsg/isomer-components"

import type {
  AdjustmentConfig,
  AdjustmentPreviewState,
  AdjustmentRenderContext,
  AspectRatio,
  BuildSingleItemPreviewBlock,
  PreviewVersion,
} from "./AdjustmentConfig"

/** Deliberate opt-outs: these component types will never have image adjustment, by design. */
export const INTENTIONALLY_NOT_ADJUSTABLE = [
  "logocloud",
  "video",
  "navbar",
] as const

// Preview-only object-fit fallback for the framed-image approximation (used
// when a real-component render fails or isn't attempted) — mirrors the real
// card's own imageFit so a fallback frame doesn't show the wrong fit.
const imageFitPreviewObjectFit = (
  fieldHost: Record<string, unknown> | undefined,
): "cover" | "contain" =>
  fieldHost?.imageFit === IMAGE_FIT.Content ? "contain" : "cover"

// Builds the InfoCards block the real-component preview renders: ONLY the card
// being edited, so it fills the tile (AdjustmentPreview forces the grid to one
// column). Drops the section's title/subtitle/link button. Keeps
// maxColumns/layout/variant so the card's per-breakpoint frame aspect (e.g.
// lg:aspect-square) matches the live page.
const buildSingleCardPreviewBlock: BuildSingleItemPreviewBlock = (
  block,
  card,
  _originalCard,
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

// InfoCards' own "cards with images" card frame (common.ts cardImageContainer)
// is 3:2 at every breakpoint on content pages EXCEPT at lg+ with maxColumns
// "3", which overrides it to 1:1 (square); "1" and "2" columns have no lg
// override there and stay 3:2. (The homepage layout has its own lg overrides,
// e.g. 2-column goes to 2:1 — but a block's image field has no way to know
// which page it's published on, so this previews the content-page frame only;
// the homepage shape is a different page than the one being edited, out of
// scope here, same reasoning as ImageGallery/the collection thumbnail skipping
// their own unknowable contexts.) Keyed by the block's own `maxColumns`
// (schema only offers "1"/"2"/"3").
const INFOCARDS_CONTENT_PAGE_DESKTOP_ASPECT_BY_MAX_COLUMNS: Record<
  "1" | "2" | "3",
  AspectRatio
> = {
  "1": { width: 3, height: 2 },
  "2": { width: 3, height: 2 },
  "3": { width: 1, height: 1 },
}

const infoCardsDesktopAspect = (block: IsomerComponent): AspectRatio => {
  const rawMaxColumns =
    block.type === "infocards" ? block.maxColumns : undefined
  const maxColumns =
    rawMaxColumns === "1" || rawMaxColumns === "2" || rawMaxColumns === "3"
      ? rawMaxColumns
      : "3"
  return INFOCARDS_CONTENT_PAGE_DESKTOP_ASPECT_BY_MAX_COLUMNS[maxColumns]
}

// Wraps a plain previewStates array as the sole `PreviewVersion` of a config
// that has no distinct shape/variant axis (i.e. almost everything but
// Blockquote) — no `label` needed since the modal only shows its version
// dropdown when there's more than one version.
const singleVersion = (
  previewStates: AdjustmentPreviewState[],
): PreviewVersion[] => [{ id: "default", previewStates }]

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
  versions: singleVersion(
    responsivePreviewStates({
      mobile: { width: 16, height: 10 },
      tablet: { width: 2, height: 1 },
      desktop: { width: 5, height: 2 },
    }),
  ),
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
  versions: singleVersion(
    responsivePreviewStates({
      mobile: { width: 16, height: 10 },
      tablet: { width: 2, height: 1 },
      desktop: { width: 5, height: 2 },
    }),
  ),
  preUploadCopy:
    "Use a high-resolution image (at least 1280×500px) with an aspect ratio between 3:2 and 2:1, key subjects centered with ample bleed, and no text.",
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
const heroCarouselConfig = (block: IsomerComponent): AdjustmentConfig => ({
  componentType: "hero:carousel",
  imageField: "backgroundUrl",
  cropMode: "custom",
  focalEnabled: true,
  // Full-bleed in the gradient layout; no CSS width cap. Warn against the
  // 1280px content ceiling as a conservative "looks soft on desktop" floor —
  // same reasoning and value as HERO_GRADIENT_CONFIG.
  maxRenderedWidthPx: 1280,
  // lg:min-h-[31.25rem] (500px) — the carousel section's actual minimum rendered
  // height (shared by both layouts' sections). Crop is free (custom), so width
  // and height can fall short independently — both must be checked.
  maxRenderedHeightPx: 500,
  // Framed preview, so these set the tile shape directly. Gradient (default):
  // closest common ratio to each hero band (375×240→16:10, 768×360→2:1,
  // 1280×500→5:2), as in HERO_GRADIENT_CONFIG. Block: imageColumn is h-80 below
  // lg and half-width at lg with min-h 500 (375×320→7:6, 768×320→12:5,
  // 640×500→5:4).
  versions: singleVersion(
    responsivePreviewStates(
      block.type === "hero" &&
        block.variant === "carousel" &&
        block.carousel?.layout === "block"
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
  ),
  skipRealComponentPreview: true,
  preUploadCopy:
    "Use a high-resolution image (at least 2560×500px) with an aspect ratio between 3:2 and 2:1, key subjects centered with ample bleed, and no text — the carousel may add a dark overlay for text contrast.",
})

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
  versions: singleVersion(
    responsivePreviewStates({
      mobile: { width: 4, height: 5 },
      tablet: { width: 2, height: 1 },
      desktop: { width: 2, height: 1 },
    }),
  ),
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
  versions: singleVersion(
    responsivePreviewStates({
      mobile: { width: 5, height: 4 },
      tablet: { width: 2, height: 1 },
      desktop: { width: 3, height: 1 },
    }),
  ),
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
  versions: singleVersion(
    responsivePreviewStates({
      mobile: { width: 1, height: 1 },
      tablet: { width: 2, height: 1 },
      desktop: { width: 2, height: 1 },
    }),
  ),
  preUploadCopy:
    "Use a high-resolution image (at least 1280×500px) with an aspect ratio between 3:2 and 2:1, key subjects centered with ample bleed.",
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
  versions: singleVersion(
    responsivePreviewStates({
      mobile: { width: 3, height: 2 },
      tablet: { width: 3, height: 2 },
      desktop: { width: 3, height: 2 },
    }),
  ),
  preUploadCopy:
    "Use a high-resolution image (at least 1500×1000px) with a 3:2 aspect ratio. Keep key subjects out of the bottom third — the text card floats over it.",
}

// Blockquote's two rendered shapes — see buildBlockquoteConfig below. Each is
// its own PreviewVersion: the circle/square split is a rendered-SHAPE axis, not
// a breakpoint, so it belongs in the versions dropdown. Within a version the
// states are the shared Mobile/Tablet/Desktop set, each carrying the version's
// page `layout` so the real component renders the right shape.
const blockquoteStates = (
  layout: IsomerPageLayoutType,
): AdjustmentPreviewState[] =>
  responsivePreviewStates({
    mobile: { width: 1, height: 1 },
    tablet: { width: 1, height: 1 },
    desktop: { width: 1, height: 1 },
  }).map((state) => ({ ...state, layout }))

const BLOCKQUOTE_CIRCLE_VERSION: PreviewVersion = {
  id: "circle",
  label: "Circle (content pages)",
  previewStates: blockquoteStates("content"),
}

const BLOCKQUOTE_SQUARE_VERSION: PreviewVersion = {
  id: "square",
  label: "Square (homepage)",
  previewStates: blockquoteStates("homepage"),
}

// Tier A — fixed 1:1 crop, no focal; crop is baked into the src like every
// other Tier A component. Blockquote renders the SAME 1:1 image two different
// shapes depending on the page's layout — a circle (rounded-full, every
// layout except homepage/notfound) or a square (homepage/notfound). When the
// page's layout is known (context-resolvable, see AdjustmentRenderContext),
// this narrows to the single version that actually applies; when it isn't
// known (e.g. this control renders in a non-page-editor context, like the
// Navbar/Footer logo settings forms), both versions are offered so the editor
// can check either shape.
const buildBlockquoteConfig = (
  pageLayout?: IsomerPageLayoutType,
): AdjustmentConfig => {
  const versions =
    pageLayout === undefined
      ? [BLOCKQUOTE_CIRCLE_VERSION, BLOCKQUOTE_SQUARE_VERSION]
      : pageLayout === "homepage" || pageLayout === "notfound"
        ? [BLOCKQUOTE_SQUARE_VERSION]
        : [BLOCKQUOTE_CIRCLE_VERSION]

  return {
    componentType: "blockquote",
    imageField: "imageSrc",
    cropMode: "fixed",
    focalEnabled: false,
    lockedRatios: [{ width: 1, height: 1 }],
    // Masked avatar: 240px on the homepage (w-60), 96px elsewhere — warn
    // against the larger.
    maxRenderedWidthPx: 240,
    versions,
    preUploadCopy:
      "Use a square (1:1) image, at least 240×240px. The subject should sit centered — this image is masked into a circle on most pages.",
  }
}

// Tier C — InfoCards "cards with images". Per-card image cover-fit into a card
// whose aspect ratio swings across breakpoints on content pages (3:2 on
// mobile/tablet; at lg it's usually still 3:2, but 3-column overrides it to
// 1:1 — see infoCardsDesktopAspect), so this is the Tier-B cover+focal pattern
// (free crop baked in, focal anchors the subject across the swing). Crop is always
// offered; focal is offered only under imageFit "cover" (isFocalApplicable) —
// under "contain" the image is letterboxed, so the focal control is hidden.
// The preview renders only the edited real card (via buildSingleItemPreviewBlock) — every other wired component gets a real
// render, and this card's shape depends on maxColumns/layout the same way a
// hand-picked approximation would have to replicate anyway.
const infoCardsWithImagesConfig = (
  block: IsomerComponent,
): AdjustmentConfig => ({
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
  // Base frame is 3:2 at every breakpoint except the lg+ overrides some
  // maxColumns apply on content pages (see infoCardsDesktopAspect) — mobile
  // and tablet share the unoverridden 3:2 base.
  versions: singleVersion(
    responsivePreviewStates({
      mobile: { width: 3, height: 2 },
      tablet: { width: 3, height: 2 },
      desktop: infoCardsDesktopAspect(block),
    }),
  ),
  preUploadCopy:
    "The card crops this image to fill its frame, and the frame's shape changes across screen sizes. Set a focal point so your key subject stays in view.",
})

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
  previewObjectFitFor: imageFitPreviewObjectFit,
  // Renders the single card for real via buildSingleItemPreviewBlock.
  buildSingleItemPreviewBlock: buildSingleCardPreviewBlock,
  // Card is square up to lg, then 2:3 portrait at lg: square on mobile/tablet,
  // portrait on desktop.
  versions: singleVersion(
    responsivePreviewStates({
      mobile: { width: 1, height: 1 },
      tablet: { width: 1, height: 1 },
      desktop: { width: 2, height: 3 },
    }),
  ),
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
  versions: singleVersion([
    { id: "mobile", label: "Mobile", viewportWidth: 375 },
    { id: "tablet", label: "Tablet", viewportWidth: 768 },
    { id: "desktop", label: "Desktop", viewportWidth: 1280 },
  ]),
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
  versions: singleVersion(
    responsivePreviewStates({
      mobile: { width: 5, height: 4 },
      tablet: { width: 3, height: 2 },
      desktop: { width: 2, height: 1 },
    }),
  ),
  preUploadCopy:
    "Gallery images are shown in full (letterboxed to fit the frame), never cropped to it. Crop here only to trim parts of the image you don't want to show.",
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
    previewObjectFitFor: imageFitPreviewObjectFit,
    // BlogCard's 2-column frame is wider (half a desktop row) than
    // CollectionCard's fixed 200px box.
    maxRenderedWidthPx: isBlogVariant ? 640 : 200,
    // CollectionCard's box is a fixed 160px tall; BlogCard's 2:1 frame at
    // that same width is shallower.
    maxRenderedHeightPx: isBlogVariant ? 320 : 160,
    skipRealComponentPreview: true,
    // Identical ratio at every breakpoint either way (CollectionCard's
    // `h-[160px] w-[200px]` and BlogCard's `aspect-[2/1]` both carry no
    // md:/lg: override), so all three preview states share one ratio.
    versions: singleVersion(
      isBlogVariant
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
    ),
    preUploadCopy:
      "This thumbnail appears on your collection listing. Choose whether it should fill the frame (cropped, with a focal point to anchor it) or fit within it (no cropping).",
  }
}

// Every static config, matched by resolveAdjustmentConfig on
// `type:variant` (or bare `type`) plus the image field name. Configs that are
// built from context/block (blockquote, InfoCards cardsWithImages, the
// collection thumbnail) are resolved explicitly before this lookup.
export const CONFIGS: AdjustmentConfig[] = [
  IMAGE_CONFIG,
  IMAGE_GALLERY_CONFIG,
  HERO_GRADIENT_CONFIG,
  HERO_LARGE_IMAGE_CONFIG,
  HERO_BLOCK_CONFIG,
  HERO_FLOATING_CONFIG,
  CONTENTPIC_CONFIG,
  INFOPIC_CONFIG,
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
  if (block.type === "blockquote" && fieldName === "imageSrc")
    return buildBlockquoteConfig(args.context?.pageLayout)
  if (
    block.type === "infocards" &&
    variant === "cardsWithImages" &&
    fieldName === "imageUrl"
  )
    return infoCardsWithImagesConfig(block)
  if (
    block.type === "hero" &&
    variant === "carousel" &&
    fieldName === "backgroundUrl"
  )
    return heroCarouselConfig(block)
  // absence = not integrated (optional by design); deliberate opt-outs are asserted in the registry test.
  return CONFIGS.find(
    (c) =>
      (c.componentType === `${block.type}:${variant}` ||
        c.componentType === block.type) &&
      c.imageField === fieldName,
  )
}
