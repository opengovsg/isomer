import type {
  AdjustmentConfig,
  AdjustmentPreviewState,
  AspectRatio,
} from "./AdjustmentConfig"

// Narrow an unknown block to read its discriminators safely.
const asBlock = (block: unknown): { type?: string; variant?: string } =>
  typeof block === "object" && block !== null ? block : {}

/** Deliberate opt-outs: these component types will never have image adjustment, by design. */
export const INTENTIONALLY_NOT_ADJUSTABLE = [
  "logocloud",
  "video",
  "navbar",
] as const

// InfoCards is Tier C: a card is always adjustable (you can crop the image that
// is then displayed) regardless of its imageFit, but the controls offered depend
// on the fit. Under "cover" ("Default") the card crops the image to fill its
// frame, so both crop and focal apply. Under "contain" ("Resize image to fit")
// the whole image is letterboxed, so the focal anchor has nothing to do — crop
// stays available (it defines the region that is then letterboxed), focal is
// hidden. imageFit is optional and defaults to "cover". The fieldHost here is
// the individual card object.
const infoCardFocalEnabled = (fieldHost: unknown): boolean =>
  (fieldHost as { imageFit?: string } | null)?.imageFit !== "contain"

const infoCardPreviewObjectFit = (fieldHost: unknown): "cover" | "contain" =>
  (fieldHost as { imageFit?: string } | null)?.imageFit === "contain"
    ? "contain"
    : "cover"

// InfoCards' own "cards with images" card frame (common.ts cardImageContainer)
// is 3:2 at every breakpoint EXCEPT at lg+, where two specific
// maxColumns+layout combos are overridden: homepage+2-column goes to 2:1,
// default(content-page)+3-column goes to 1:1 (square) — every other
// combination (including 1-column, which has no lg override at all) stays
// 3:2. Keyed by the block's own `maxColumns` (schema only offers "1"/"2"/"3").
const INFOCARDS_DESKTOP_ASPECT_BY_MAX_COLUMNS: Record<
  "1" | "2" | "3",
  { homepage: AspectRatio; contentPage: AspectRatio }
> = {
  "1": {
    homepage: { width: 3, height: 2 },
    contentPage: { width: 3, height: 2 },
  },
  "2": {
    homepage: { width: 2, height: 1 },
    contentPage: { width: 3, height: 2 },
  },
  "3": {
    homepage: { width: 3, height: 2 },
    contentPage: { width: 1, height: 1 },
  },
}

const aspectRatiosEqual = (a: AspectRatio, b: AspectRatio): boolean =>
  a.width / a.height === b.width / b.height

// Builds the lg+ preview state(s) for "cards with images" from the actual
// block's maxColumns. A block's image field has no way to know which page
// it's published on, so when the homepage/content-page shapes for this
// maxColumns actually differ, both are previewed (same per-state `layout`
// pattern Blockquote uses) rather than guessing one; when they're the same
// shape (1-column, or any combo without an lg override), a single state
// covers it.
const infoCardsDesktopStates = (block: unknown): AdjustmentPreviewState[] => {
  const rawMaxColumns = (block as { maxColumns?: unknown } | null)?.maxColumns
  const maxColumns =
    rawMaxColumns === "1" || rawMaxColumns === "2" || rawMaxColumns === "3"
      ? rawMaxColumns
      : "3"
  const { homepage, contentPage } =
    INFOCARDS_DESKTOP_ASPECT_BY_MAX_COLUMNS[maxColumns]

  if (aspectRatiosEqual(homepage, contentPage)) {
    return [
      {
        id: "desktop",
        label: `Desktop (${maxColumns} column${maxColumns === "1" ? "" : "s"})`,
        layout: "content",
        aspectRatio: contentPage,
      },
    ]
  }

  return [
    {
      id: "desktop-content",
      label: `Desktop (${maxColumns} columns, content pages)`,
      layout: "content",
      aspectRatio: contentPage,
    },
    {
      id: "desktop-homepage",
      label: `Desktop (${maxColumns} columns, homepage)`,
      layout: "homepage",
      aspectRatio: homepage,
    },
  ]
}

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
  // Full-bleed; no CSS width cap. Warn against the 1280px content ceiling
  // (max-w-screen-xl) as a conservative "looks soft on desktop" floor.
  maxRenderedWidthPx: 1280,
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
  // Image band is half the viewport at lg (lg:w-1/2); ~960px on large desktop.
  maxRenderedWidthPx: 960,
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
  // Fixed 200px-wide frame from sm up (sm:w-[200px]).
  maxRenderedWidthPx: 200,
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
  preUploadCopy:
    "Use a high-resolution image (at least 400×480px) with a 5:6 (portrait) aspect ratio. Keep the key subject centered — the image is cropped to a fixed portrait frame beside your text.",
}

// Tier B — responsive image with text. Content-dependent cover: frame height
// varies with copy length, so preview aspect ratios are approximations.
const INFOPIC_CONFIG: AdjustmentConfig = {
  componentType: "infopic",
  cropMode: "custom",
  focalEnabled: true,
  // One of two columns at lg (lg:grid-cols-2); ~960px on large desktop.
  maxRenderedWidthPx: 960,
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
  // Full-bleed; warn against the 1280px content ceiling (same as hero:gradient).
  maxRenderedWidthPx: 1280,
  previewStates: responsivePreviewStates({
    mobile: { width: 1, height: 1 },
    tablet: { width: 2, height: 1 },
    desktop: { width: 2, height: 1 },
  }),
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
// layout except homepage/notfound) or a square (homepage) — so both are
// previewed, each forcing its own `layout` on the shared real-component
// preview (see AdjustmentPreview's per-state layout override) rather than
// relying on a breakpoint/viewport difference.
const BLOCKQUOTE_CONFIG: AdjustmentConfig = {
  componentType: "blockquote",
  cropMode: "fixed",
  focalEnabled: false,
  lockedRatios: [{ width: 1, height: 1 }],
  // Masked avatar: 240px on the homepage (w-60), 96px elsewhere — warn against
  // the larger.
  maxRenderedWidthPx: 240,
  // Both states are 1:1 — side-by-side they'd be small; stack them so each
  // circle/square mask gets the full preview column width.
  stackPreviews: true,
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

// Tier C — InfoCards "cards with images". Per-card image cover-fit into a card
// whose aspect ratio swings across breakpoints (3:2 on mobile; at lg it's
// usually still 3:2, but the default 3-column content-page layout overrides it
// to 1:1 and the 2-column homepage layout overrides it to 2:1 — see
// infoCardsDesktopStates), so this is the Tier-B cover+focal pattern (free crop
// baked in, focal anchors the subject across the swing). Crop is always
// offered; focal is offered only under imageFit "cover" (focalEnabledFor) —
// under "contain" the image is letterboxed, so the preview switches to
// object-contain (previewObjectFitFor) and the focal control is hidden. The
// preview uses the framed-image approximation, not the real block (which would
// render every card).
const infoCardsWithImagesConfig = (block: unknown): AdjustmentConfig => ({
  componentType: "infocards:cardsWithImages",
  cropMode: "custom",
  focalEnabled: true,
  // Card width depends on column count (1200px at 1 column down to ~260px at 4);
  // warn against a generous multi-column card width so the common 2–4 column
  // grids don't false-warn on perfectly sharp images.
  maxRenderedWidthPx: 640,
  focalEnabledFor: infoCardFocalEnabled,
  previewObjectFitFor: infoCardPreviewObjectFit,
  skipRealComponentPreview: true,
  previewStates: [
    {
      id: "mobile",
      label: "Mobile",
      viewportWidth: 375,
      aspectRatio: { width: 3, height: 2 },
    },
    ...infoCardsDesktopStates(block),
  ],
  preUploadCopy:
    "The card crops this image to fill its frame, and the frame's shape changes across screen sizes. Set a focal point so your key subject stays in view.",
})

// Tier C — InfoCards "cards with full images". Same conditional crop/focal as
// the default variant, but the image fills the whole card (square on mobile →
// 2:3 portrait at lg) with a dark bottom gradient the title sits over. That
// overlay is mirrored as a scrim so editors can judge whether the focal keeps
// the subject clear of the text.
const INFOCARDS_WITH_FULL_IMAGE_CONFIG: AdjustmentConfig = {
  componentType: "infocards:cardsWithFullImages",
  cropMode: "custom",
  focalEnabled: true,
  // Same column-dependent card width as cardsWithImages — warn against a
  // generous multi-column width (see that config).
  maxRenderedWidthPx: 640,
  focalEnabledFor: infoCardFocalEnabled,
  previewObjectFitFor: infoCardPreviewObjectFit,
  skipRealComponentPreview: true,
  previewStates: [
    {
      id: "mobile",
      label: "Mobile",
      viewportWidth: 375,
      aspectRatio: { width: 1, height: 1 },
    },
    { id: "desktop", label: "Desktop", aspectRatio: { width: 2, height: 3 } },
  ],
  // Approximates the real card's bottom-half dark gradient (the title overlay):
  // opaque at the bottom edge, fading out by the vertical midpoint.
  scrim: {
    id: "infocards-full-image-overlay",
    className:
      "bg-gradient-to-t from-[rgba(38,38,38,0.9)] via-[rgba(38,38,38,0)] via-[50%] to-transparent",
  },
  preUploadCopy:
    "The card crops this image to fill its frame and overlays the title on a dark gradient at the bottom. Keep your key subject in the upper half and set a focal point to anchor it.",
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
  if (type === "infocards" && variant === "cardsWithImages")
    return infoCardsWithImagesConfig(args.block)
  if (type === "infocards" && variant === "cardsWithFullImages")
    return INFOCARDS_WITH_FULL_IMAGE_CONFIG
  // absence = not integrated (optional by design); deliberate opt-outs are asserted in the registry test.
  return undefined
}
