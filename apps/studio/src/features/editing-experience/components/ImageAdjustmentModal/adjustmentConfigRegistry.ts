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
// its own PreviewVersion (not a second entry in one version's previewStates):
// the circle/square split is a rendered-SHAPE axis, not a breakpoint, so it
// belongs in the versions dropdown rather than the breakpoint row.
const BLOCKQUOTE_CIRCLE_VERSION: PreviewVersion = {
  id: "circle",
  label: "Circle (content pages)",
  previewStates: [
    {
      id: "circle",
      label: "Circle (content pages)",
      layout: "content",
      viewportWidth: 768,
      aspectRatio: { width: 1, height: 1 },
    },
  ],
}

const BLOCKQUOTE_SQUARE_VERSION: PreviewVersion = {
  id: "square",
  label: "Square (homepage)",
  previewStates: [
    {
      id: "square",
      label: "Square (homepage)",
      layout: "homepage",
      viewportWidth: 768,
      aspectRatio: { width: 1, height: 1 },
    },
  ],
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
    // Each version has a single 1:1 state, which would be small as a
    // half-width tile — stack it to use the full preview column width.
    stackPreviews: true,
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

// Every static config, matched by resolveAdjustmentConfig on
// `type:variant` (or bare `type`) plus the image field name. Configs that are
// built from context/block (blockquote, InfoCards cardsWithImages) are resolved explicitly before this lookup.
export const CONFIGS: AdjustmentConfig[] = [
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
  // absence = not integrated (optional by design); deliberate opt-outs are asserted in the registry test.
  return CONFIGS.find(
    (c) =>
      (c.componentType === `${block.type}:${variant}` ||
        c.componentType === block.type) &&
      c.imageField === fieldName,
  )
}
