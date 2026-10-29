import type { IsomerPageLayoutType } from "@opengovsg/isomer-components"

import type {
  AdjustmentConfig,
  AdjustmentPreviewState,
  AdjustmentRenderContext,
  AspectRatio,
  PreviewVersion,
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

// Builds the InfoCards block the real-component preview renders. Renders the
// real sibling cards alongside the one being edited (edited card patched in via
// `originalCard`) so the multi-column grid (e.g. maxColumns "3") looks natural
// instead of a lone card in empty columns. Drops the section's own
// title/subtitle/link button — those belong to the containing block, not the
// grid of cards, and would clutter the small preview tile. Keeps
// maxColumns/layout as-is so the cards' real per-breakpoint aspect (e.g. the
// lg:aspect-square compound variant) matches the live page exactly. Falls back
// to just the edited card if it can't be located among the siblings.
const buildSingleCardPreviewBlock = (
  block: unknown,
  card: unknown,
  originalCard?: unknown,
): Record<string, unknown> | undefined => {
  if (typeof block !== "object" || block === null) return undefined
  const blockRecord = block as Record<string, unknown>
  const siblings: unknown[] = Array.isArray(blockRecord.cards)
    ? blockRecord.cards
    : []
  const cards =
    originalCard !== undefined && siblings.some((c) => c === originalCard)
      ? siblings.map((c) => (c === originalCard ? card : c))
      : [card]
  return {
    ...blockRecord,
    title: "",
    subtitle: undefined,
    url: undefined,
    label: undefined,
    cards,
  }
}

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
  ownsImageFitField: true,
  // Card width depends on column count (1200px at 1 column down to ~260px at 4);
  // warn against a generous multi-column card width so the common 2–4 column
  // grids don't false-warn on perfectly sharp images.
  maxRenderedWidthPx: 640,
  // Image frame is 3:2 (cardImageContainer aspect-[3/2]) → ~427px tall at
  // 640px. Crop is free (custom), so height must be checked independently
  // of width.
  maxRenderedHeightPx: 427,
  focalEnabledFor: infoCardFocalEnabled,
  previewObjectFitFor: infoCardPreviewObjectFit,
  // Preview shows just the cropped image, not the card chrome/text: on this
  // variant the title/description sit in a separate section below the image, so
  // they add nothing to a crop/focal preview. Use the framed-image
  // approximation (previewStates below set its shape); fit/fill still drives
  // object-fit there via previewObjectFitFor.
  skipRealComponentPreview: true,
  versions: singleVersion([
    {
      id: "mobile",
      label: "Mobile",
      viewportWidth: 375,
      aspectRatio: { width: 3, height: 2 },
    },
    ...infoCardsDesktopStates(block),
  ]),
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
  ownsImageFitField: true,
  // Same column-dependent card width as cardsWithImages — warn against a
  // generous multi-column width (see that config).
  maxRenderedWidthPx: 640,
  // Full-image cards are square on mobile, portrait at lg (lg:aspect-[2/3]);
  // 640 is a conservative height representative (the square case at 640px).
  maxRenderedHeightPx: 640,
  focalEnabledFor: infoCardFocalEnabled,
  previewObjectFitFor: infoCardPreviewObjectFit,
  // Renders the single card for real via buildSingleItemPreviewBlock; falls
  // back to the framed-image approximation (with its scrim below) if that
  // render fails or produces nothing (see AdjustmentPreview).
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
  // Approximates the real card's bottom-half dark gradient (the title overlay):
  // opaque at the bottom edge, fading out by the vertical midpoint.
  scrim: {
    id: "infocards-full-image-overlay",
    // Exactly the gradient InfoCardWithFullImage renders (from-[…100%] to-[…0%]),
    // so Studio's Tailwind actually generates these classes (it scans the real
    // component) and the preview overlay matches the published card.
    className:
      "bg-gradient-to-t from-[rgba(38,38,38,100%)] to-[rgba(38,38,38,0%)]",
  },
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
// branch). The SAME source image feeds multiple, simultaneous destinations —
// not alternatives, a collection item can be rendered by more than one of
// these at once — each with its own fixed-but-different frame:
//  - CollectionCard: the collection's own index listing, a fixed 200x160px
//    (5:4) frame, object-cover (falls back to object-contain + site logo
//    when there's no image).
//  - CollectionBlock: embedded elsewhere (e.g. homepage) referencing this
//    collection. Card frame is aspect-[3/2] normally, but lg:aspect-[2/1]
//    ONLY when the block ends up showing exactly 2 cards — driven by the
//    live collection item count at render time, which this field's editor
//    genuinely cannot know. Both shapes are modelled as always-shown
//    versions rather than guessing one.
//  - BlogCard: the collection's "2-column" listing variant, a fixed
//    aspect-[2/1] frame (no responsive override), object-cover.
// ChildrenPages was considered but ruled out: it only ever reads the
// immediate children of the page it's placed on, and a collection's items
// are children of the Collection resource, one level below that — so a
// ChildrenPages block can never reach an individual item's thumbnail (at
// most it would show the Collection's own page.image, a different field).
// cropMode is "custom" (free crop): a shared source image serving multiple
// fixed-but-different-per-destination frames, not one fixed shape. Focal is
// enabled because every destination cover-fits into a frame whose shape can
// differ (per-destination, and per-breakpoint for CollectionBlock), the same
// "reshaping cover frame" rule the rest of the registry uses. The real
// render context is a DIFFERENT page (the collection index, or whatever page
// embeds the CollectionBlock), not the one being edited — skip the
// real-component preview in favour of the framed approximation, as
// ImageGallery does for the same reason.
const COLLECTION_THUMBNAIL_CONFIG: AdjustmentConfig = {
  componentType: "collection:thumbnail",
  cropMode: "custom",
  focalEnabled: true,
  // Widest of the three destination frames (CollectionCard 200px,
  // CollectionBlock card ~1/3 of a 1280px desktop row, BlogCard ~1/2 of that
  // same row) — conservative so the narrower frames don't false-warn.
  maxRenderedWidthPx: 640,
  // CollectionCard's fixed 160px frame is the tallest of the three at that
  // width; the others are wider, shallower crops.
  maxRenderedHeightPx: 160,
  skipRealComponentPreview: true,
  versions: [
    {
      // CollectionCard's thumbnail box is a literal `h-[160px] w-[200px]` with
      // no md:/lg: override — identical 5:4 at every breakpoint.
      id: "collection-card",
      label: "Index page",
      groupLabel: "Collection index page",
      previewStates: responsivePreviewStates({
        mobile: { width: 5, height: 4 },
        tablet: { width: 5, height: 4 },
        desktop: { width: 5, height: 4 },
      }),
    },
    {
      id: "collection-block-3-2",
      // The homepage block shows up to 3 cards at once (capped — a 4th, 5th,
      // ... item never changes its layout further), so "1 or 3+ items" is the
      // accurate editor-facing framing: it covers every collection size this
      // ratio actually applies to, without implying a cap of 3 the editor has
      // no reason to know about. Kept short for the dropdown; the preview
      // tile caption below spells out "items in collection" in full.
      // CollectionBlock.tsx's cardImageContainer is "aspect-[3/2]" with no
      // numberOfCards override for 1 or 3 -- 3:2 at every breakpoint.
      label: "1 or 3+ items in collection",
      groupLabel: "Homepage block",
      previewStates: responsivePreviewStates({
        mobile: { width: 3, height: 2 },
        tablet: { width: 3, height: 2 },
        desktop: { width: 3, height: 2 },
      }),
    },
    {
      id: "collection-block-2-1",
      // CollectionBlock.tsx's numberOfCards:2 compound variant overrides
      // cardImageContainer to "aspect-[3/2] lg:aspect-[2/1]" -- 3:2 below lg
      // (mobile/tablet), 2:1 only at lg+ (desktop).
      label: "2 items in collection",
      groupLabel: "Homepage block",
      previewStates: responsivePreviewStates({
        mobile: { width: 3, height: 2 },
        tablet: { width: 3, height: 2 },
        desktop: { width: 2, height: 1 },
      }),
    },
    {
      // BlogCard.tsx's thumbnail is "aspect-[2/1]" with no md:/lg: override --
      // identical 2:1 at every breakpoint.
      id: "blog-card",
      label: "Blog listing",
      groupLabel: "Blog listing page",
      previewStates: responsivePreviewStates({
        mobile: { width: 2, height: 1 },
        tablet: { width: 2, height: 1 },
        desktop: { width: 2, height: 1 },
      }),
    },
  ],
  preUploadCopy:
    "This thumbnail can appear in several places — the collection listing, a 2-column blog listing, and a homepage block — each with a different crop. Set a focal point so your key subject stays in view everywhere it's used.",
}

/**
 * Resolves the adjustment config for an image field, by the containing block's
 * discriminators. Returns undefined for components not yet wired — the entry
 * point hides the "Adjust image" action rather than offering a dead modal.
 */
export function resolveAdjustmentConfig(args: {
  block: unknown
  fieldName: string
  context?: AdjustmentRenderContext
}): AdjustmentConfig | undefined {
  // Page-level thumbnail field (no block-type ancestor) on a confirmed
  // collection item — see COLLECTION_THUMBNAIL_CONFIG. Checked before the
  // block-type switch below since this field's host has no `type`
  // discriminator for that switch to key off.
  if (args.context?.isCollectionThumbnail) return COLLECTION_THUMBNAIL_CONFIG

  const { type, variant } = asBlock(args.block)
  if (type === "image") return IMAGE_CONFIG
  if (type === "imagegallery") return IMAGE_GALLERY_CONFIG
  if (type === "hero" && variant === "gradient") return HERO_GRADIENT_CONFIG
  if (type === "hero" && variant === "largeImage")
    return HERO_LARGE_IMAGE_CONFIG
  if (type === "hero" && variant === "block") return HERO_BLOCK_CONFIG
  if (type === "hero" && variant === "floating") return HERO_FLOATING_CONFIG
  if (type === "contentpic") return CONTENTPIC_CONFIG
  if (type === "infopic") return INFOPIC_CONFIG
  if (type === "blockquote")
    return buildBlockquoteConfig(args.context?.pageLayout)
  if (type === "infocards" && variant === "cardsWithImages")
    return infoCardsWithImagesConfig(args.block)
  if (type === "infocards" && variant === "cardsWithFullImages")
    return INFOCARDS_WITH_FULL_IMAGE_CONFIG
  // absence = not integrated (optional by design); deliberate opt-outs are asserted in the registry test.
  return undefined
}
