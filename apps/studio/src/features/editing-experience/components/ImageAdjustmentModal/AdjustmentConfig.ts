import type {
  IsomerComponent,
  IsomerPageLayoutType,
} from "@opengovsg/isomer-components"

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
// given breakpoint, all sharing the single crop + focal. For Tier B the biting
// aspect ratio differs per breakpoint — declared here so the preview can show
// which axis the focal actually moves at that state. The real-component
// preview renders at the page's own layout, so a component whose shape follows
// the layout (e.g. Blockquote: circle on content pages, square on the
// homepage) needs nothing extra here.
export interface AdjustmentPreviewState {
  id: string
  label: string
  viewportWidth?: number
  aspectRatio?: AspectRatio
}

// Extensible options bag for context the registry can use when resolving a
// config for a given instance (e.g. the page's layout). Add fields here as
// future cases need them — this is deliberately just a plain
// optional-properties object, not a plugin system.
export interface AdjustmentRenderContext {
  pageLayout?: IsomerPageLayoutType
}

// For an array-nested image field (e.g. an InfoCards card) whose containing
// block renders EVERY item, builds a block containing ONLY the edited item, so
// the preview shows that one item rather than the whole block. `editedItem` is
// the field host (e.g. the card object) with the adjusted image +
// imageAdjustment already spliced in. Return undefined to skip the
// real-component preview for this render (falls back to the framed-image
// approximation) — e.g. if `ownerBlock` isn't shaped as expected.
export type BuildSingleItemPreviewBlock = (
  ownerBlock: IsomerComponent,
  editedItem: Record<string, unknown>,
) => IsomerComponent | undefined

export interface AdjustmentConfig {
  // Block/component type key this config applies to.
  componentType: string
  // Name of the image field this config adjusts (e.g. "backgroundUrl").
  imageField: string
  cropMode: CropMode
  // For cropMode "fixed": the ratio(s) to enforce. One entry = Tier A. Multiple
  // = Tier B responsive (ratio varies by breakpoint, paired with previewStates).
  lockedRatios?: AspectRatio[]
  // Capability flag: whether the focal-point control can ever be offered (Tier
  // B/C; false for A / D). With ownsImageFitField the modal additionally hides
  // it while the fit is "contain" (see isFocalApplicable).
  focalEnabled: boolean
  // The breakpoints the preview rail shows (Mobile / Tablet / Desktop).
  previewStates: AdjustmentPreviewState[]
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
  // Tier C conditional preview fit: the object-fit the framed-image preview
  // (skipRealComponentPreview path) uses, resolved from the field host.
  previewObjectFitFor?: (
    fieldHost: Record<string, unknown> | undefined,
  ) => "cover" | "contain"
  // Opt out of the real-component preview in favour of the framed-image
  // approximation below. For an array-nested image field whose host component
  // has no buildSingleItemPreviewBlock (or it returns undefined for a given
  // item) — the approximation (one framed image per state) is the
  // fallback for a component that can't produce a meaningful single-item
  // real render.
  skipRealComponentPreview?: boolean
  // For an array-nested image field whose config does NOT set
  // skipRealComponentPreview, builds the synthetic single-item block the
  // real-component preview renders (see BuildSingleItemPreviewBlock). Omitting
  // this while the field is array-nested is equivalent to skipping the
  // real-component preview for that render (AdjustmentPreview falls back to
  // the framed approximation rather than rendering every item).
  buildSingleItemPreviewBlock?: BuildSingleItemPreviewBlock
  // Has a sibling imageFit field that the modal's fit control writes to
  // (InfoCards' "Resize image to fit").
  ownsImageFitField?: boolean
}
