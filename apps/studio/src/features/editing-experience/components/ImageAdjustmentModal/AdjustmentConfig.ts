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

// A named, switchable variant of a component's preview set — e.g. Blockquote's
// "circle" vs "square" mask. Each version carries its OWN full breakpoint
// preview set (the old flat `previewStates`, now scoped per-version instead of
// global), so the two axes (breakpoint vs. rendered-shape variant) don't get
// conflated into one array. The modal shows a dropdown to switch between
// versions, but only when a config declares more than one.
export interface PreviewVersion {
  // Stable key, e.g. "circle", "square", "default".
  id: string
  // Dropdown option text. Omit when there's only one version — it's never
  // shown, so most configs don't need it.
  label?: string
  previewStates: AdjustmentPreviewState[]
}

// Extensible options bag for context the registry can use to narrow which
// version(s) of a config apply to a given instance. Blockquote reads
// `pageLayout` to deterministically pick circle vs. square when the page's
// layout is known; everyone else ignores it. Add fields here as future cases
// need them — this is deliberately just a plain optional-properties object,
// not a plugin system.
export interface AdjustmentRenderContext {
  pageLayout?: IsomerPageLayoutType
}

// For an array-nested image field (e.g. an InfoCards card) whose containing
// block renders EVERY item, builds the block to render for the preview.
// `editedItem` is the field host (e.g. the card object) with the adjusted image +
// imageAdjustment already spliced in; `originalItem` is that same host BEFORE
// the splice, so the builder can locate it among the block's items and swap in
// the adjusted copy — rendering the real sibling items alongside it so the
// multi-column grid looks natural. Return undefined to skip the real-component
// preview for this render (falls back to the framed-image approximation) — e.g.
// if `ownerBlock` isn't shaped as expected.
export type BuildSingleItemPreviewBlock = (
  ownerBlock: IsomerComponent,
  editedItem: Record<string, unknown>,
  originalItem: Record<string, unknown>,
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
  // One or more named preview versions (e.g. Blockquote's circle/square masks).
  // Always >= 1 entry. The modal shows a dropdown to pick the active one only
  // when there's more than one; otherwise it renders the single version's
  // previewStates directly, same as before this existed.
  versions: PreviewVersion[]
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
