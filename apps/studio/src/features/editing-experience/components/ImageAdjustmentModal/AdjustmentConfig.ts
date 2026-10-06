// FROZEN CONTRACT (W0-A / ISOM-2587). The per-component declaration that drives
// the component-agnostic image adjustment modal (W0-D). Every per-component
// fan-out task (M2/M3) adds one entry implementing this shape; the modal reads
// it and contains no component-specific logic of its own. Change this only with
// orchestrator sign-off — it is the interface the whole feature is built on.

// Image tier taxonomy (see KB GLOSSARY): A = fixed-ratio crop, B = responsive
// crop + focal, C = conditional Fit/Fill, D = preserve-only.
export type ImageTier = "A" | "B" | "C" | "D"

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
// show which axis the focal actually moves at that state.
export interface AdjustmentPreviewState {
  id: string
  label: string
  viewportWidth?: number
  aspectRatio?: AspectRatio
}

// Optional non-rectangular mask overlaid on the preview (e.g. Blockquote circle).
export interface AdjustmentMask {
  id: string
  label: string
  shape: "circle" | "square" | "rounded"
}

// Optional scrim/overlay drawn over the preview to mirror the live component
// (e.g. HeroGradient's left-to-right dark gradient) so editors can judge contrast.
export interface AdjustmentScrim {
  id: string
  className: string
}

export interface AdjustmentConfig {
  // Block/component type key this config applies to.
  componentType: string
  tier: ImageTier
  cropMode: CropMode
  // For cropMode "fixed": the ratio(s) to enforce. One entry = Tier A. Multiple
  // = Tier B responsive (ratio varies by breakpoint, paired with previewStates).
  lockedRatios?: AspectRatio[]
  // Whether the focal-point control is offered (Tier B; false for A / C / D).
  focalEnabled: boolean
  // Breakpoint/layout previews to render; array order = tab order in the modal.
  previewStates: AdjustmentPreviewState[]
  masks?: AdjustmentMask[]
  scrims?: AdjustmentScrim[]
  // Guidance copy shown before/around upload (resolution hints etc.).
  preUploadCopy?: string
  // Tier C conditional enablement: adjustment is offered only when this returns
  // true for the current block value (e.g. InfoCards only under Fill). When it
  // returns false, the entry-point shows disabledReason instead of opening.
  isAdjustable?: (blockValue: unknown) => boolean
  disabledReason?: string
}
