import type { IsomerPageLayoutType } from "@opengovsg/isomer-components"

// FROZEN CONTRACT (W0-A / ISOM-2587). The per-component declaration that drives
// the component-agnostic image adjustment modal (W0-D). Every per-component
// fan-out task (M2/M3) adds one entry implementing this shape; the modal reads
// it and contains no component-specific logic of its own. Change this only with
// orchestrator sign-off — it is the interface the whole feature is built on.

// fixed  = one or more locked aspect ratios.
// custom = free-form crop (native Image block, P2 — out of scope for v1).
// none   = no crop offered (Tier D preserve-only).
export type CropMode = "fixed" | "custom" | "none"

export interface AspectRatio {
  width: number
  height: number
}

// One preview pane in the modal: a real render of the target component at a
// given breakpoint/layout, all sharing the single crop + focal. For Tier B the
// biting aspect ratio differs per breakpoint — declared here so the preview can
// show which axis the focal actually moves at that state. For a component
// whose rendered shape changes with the page's `layout` rather than the
// viewport (e.g. Blockquote: circle on a content page, square on the
// homepage), set `layout` per state instead of (or alongside) viewportWidth —
// the real-component preview passes it straight to `renderComponent`,
// defaulting to "content" when omitted.
export interface AdjustmentPreviewState {
  id: string
  label: string
  viewportWidth?: number
  aspectRatio?: AspectRatio
  layout?: IsomerPageLayoutType
}

// Optional scrim/overlay drawn over the preview to mirror the live component
// (e.g. HeroGradient's left-to-right dark gradient) so editors can judge contrast.
export interface AdjustmentScrim {
  id: string
  className: string
}

// For an array-nested image field (e.g. an InfoCards card) whose containing
// block renders EVERY item, builds the block to render for the preview. `item`
// is the field host (e.g. the card object) with the adjusted image +
// imageAdjustment already spliced in; `originalItem` is that same host BEFORE
// the splice, so the builder can locate it among the block's items and swap in
// the adjusted copy — rendering the real sibling items alongside it so the
// multi-column grid looks natural. Return undefined to skip the real-component
// preview for this render (falls back to the framed-image approximation) — e.g.
// if `block` isn't shaped as expected.
export type BuildSingleItemPreviewBlock = (
  block: unknown,
  item: unknown,
  originalItem?: unknown,
) => Record<string, unknown> | undefined

export interface AdjustmentConfig {
  // Block/component type key this config applies to.
  componentType: string
  cropMode: CropMode
  // For cropMode "fixed": the ratio(s) to enforce. One entry = Tier A. Multiple
  // = Tier B responsive (ratio varies by breakpoint, paired with previewStates).
  lockedRatios?: AspectRatio[]
  // Whether the focal-point control is offered (Tier B; false for A / D).
  // For Tier C (InfoCards) this is the default; focalEnabledFor overrides it per
  // field host (focal is meaningless once the image is letterboxed under "Resize
  // image to fit", so it's hidden there).
  focalEnabled: boolean
  // Breakpoint/layout previews to render; array order = tab order in the modal.
  previewStates: AdjustmentPreviewState[]
  // A single overlay mirroring the live component (e.g. HeroGradient's gradient).
  scrim?: AdjustmentScrim
  // Guidance copy shown before/around upload (resolution hints etc.).
  preUploadCopy?: string
  // The widest CSS-pixel width the image renders into on the published site
  // (across all breakpoints). Used to warn when the cropped region can't fill
  // that frame even at 1x — i.e. the result would look soft/blurry. Omit for
  // components whose frame width isn't meaningfully bounded.
  maxRenderedWidthPx?: number
  // The tallest CSS-pixel height of that same rendered frame. Needed to warn
  // correctly for fixed-height frames: under object-contain the image is only
  // upscaled when it falls short on BOTH axes, so a height target is required to
  // tell a genuinely small crop from a sharp wide/tall one (see
  // computeLowResWarning). Omit when the frame height isn't meaningfully bounded
  // (e.g. a width-driven natural-aspect image whose height just follows width).
  maxRenderedHeightPx?: number
  // Tier C conditional focal: overrides focalEnabled based on the field's
  // immediate host object — the block itself, or for an array-nested image field
  // (e.g. an InfoCards card) the card object. InfoCards offers the focal point
  // only under imageFit "cover"; under "contain" ("Resize image to fit") the
  // whole image is letterboxed, so a focal anchor has nothing to do. Crop stays
  // available in both fits (the crop defines the region that is then letterboxed).
  focalEnabledFor?: (fieldHost: unknown) => boolean
  // Tier C conditional preview fit: the object-fit the framed-image preview
  // (skipRealComponentPreview path) uses, resolved from the field host. InfoCards
  // returns "contain" under "Resize image to fit" so the preview matches the
  // letterboxed published result instead of always showing a cover crop.
  previewObjectFitFor?: (fieldHost: unknown) => "cover" | "contain"
  // Opt out of the real-component preview (W0-I) in favour of the framed-image
  // approximation. Needed for array-nested image fields (InfoCards) where the
  // real component renders the whole block/all cards, not the single card being
  // edited — the approximation (one framed image + scrim per state) is both
  // simpler and a better single-card preview.
  skipRealComponentPreview?: boolean
  // For an array-nested image field whose config does NOT set
  // skipRealComponentPreview, builds the synthetic single-item block the
  // real-component preview renders (see BuildSingleItemPreviewBlock). Omitting
  // this while the field is array-nested is equivalent to skipping the
  // real-component preview for that render (AdjustmentPreview falls back to
  // the framed approximation rather than rendering every item).
  buildSingleItemPreviewBlock?: BuildSingleItemPreviewBlock
  // Stack the preview frames vertically (one per row) instead of side-by-side,
  // so each frame gets the full column width. Use for components with only a
  // couple of small-ratio states where side-by-side makes each too small to
  // read (e.g. Blockquote's circle + square 1:1 masks).
  stackPreviews?: boolean
  // Has a sibling imageFit field that the modal's fit control writes to
  // (InfoCards' "Resize image to fit").
  ownsImageFitField?: boolean
}
