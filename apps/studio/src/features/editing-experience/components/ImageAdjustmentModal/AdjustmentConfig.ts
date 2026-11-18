import type {
  IsomerComponent,
  IsomerPageLayoutType,
} from "@opengovsg/isomer-components"

// FROZEN CONTRACT (W0-A / ISOM-2587). The per-component declaration that drives
// the component-agnostic image adjustment modal (W0-D). Every per-component
// fan-out task (M2/M3) adds one entry implementing this shape; the modal reads
// it and contains no component-specific logic of its own.

// fixed  = one or more locked aspect ratios.
// custom = free-form crop (native Image block, P2 — out of scope for v1).
// none   = no crop offered (Tier D preserve-only).
export type CropMode = "fixed" | "custom" | "none"

export interface AspectRatio {
  width: number
  height: number
}

// One preview pane. Renders the target component at one breakpoint, and all
// panes share the single crop and focal point. The real-component preview
// uses the page's own layout, so layout-dependent shapes need nothing here.
export interface AdjustmentPreviewState {
  id: string
  label: string
  viewportWidth?: number
  aspectRatio?: AspectRatio
}

// Context the registry can use to resolve a config, e.g. the page layout.
export interface AdjustmentRenderContext {
  pageLayout?: IsomerPageLayoutType
  // True for a collection item's page thumbnail (`page.image`). It has no
  // block to key the registry off, so the hook sets this from the resource type.
  isCollectionThumbnail?: boolean
  // The parent collection's "Layout" setting: "collection" is the 1-column
  // CollectionCard, "blog" the 2-column BlogCard. Undefined while loading,
  // which resolves to the 1-column frame.
  collectionVariant?: "collection" | "blog"
}

// Builds the block the real-component preview renders for an image inside an
// array. `editedItem` has the adjusted image patched in, and `itemIndex` is
// its position in that array, taken from the form path.
// Return undefined to use the framed-image preview. Set `activeIndex` when the
// component shows one item at a time, like the hero carousel.
export type BuildSingleItemPreviewBlock = (
  ownerBlock: IsomerComponent,
  editedItem: Record<string, unknown>,
  itemIndex: number | undefined,
) => { component: IsomerComponent; activeIndex?: number } | undefined

export interface AdjustmentConfig {
  // Block/component type key this config applies to.
  componentType: string
  // The image field this config adjusts, e.g. "backgroundUrl".
  imageField: string
  cropMode: CropMode
  // For cropMode "fixed": the ratio(s) to enforce. One entry = Tier A. Multiple
  // = Tier B responsive (ratio varies by breakpoint, paired with previewStates).
  lockedRatios?: AspectRatio[]
  // Whether the focal-point control can be offered at all. With
  // ownsImageFitField the modal also hides it while the fit is "contain".
  focalEnabled: boolean
  // The breakpoints the preview rail shows.
  previewStates: AdjustmentPreviewState[]
  // Guidance copy shown before/around upload (resolution hints etc.).
  preUploadCopy?: string
  // The banner appends "Read the <guideLabel> guide or download a template for
  // your image." Without a templateUrl it ends "to plan your image." instead.
  preUploadLinks?: {
    guideLabel: string
    guideUrl: string
    templateUrl?: string
  }
  // The recommended upload width from preUploadCopy. The modal warns when the
  // crop is narrower. Omit if the width is unbounded.
  maxRenderedWidthPx?: number
  // The recommended upload height from preUploadCopy. The modal warns when the
  // crop is shorter. Omit when the height follows the width.
  maxRenderedHeightPx?: number
  // Resolves the framed-image preview's object-fit from the field host.
  previewObjectFitFor?: (
    fieldHost: Record<string, unknown> | undefined,
  ) => "cover" | "contain"
  // Use the framed-image approximation, not the real component. For an
  // array-nested field whose component can't render a single item.
  skipRealComponentPreview?: boolean
  // Builds the one-item block for an array-nested field's real-component
  // preview. Without it the preview uses the framed-image approximation.
  buildSingleItemPreviewBlock?: BuildSingleItemPreviewBlock
  // The modal's fit control writes to a sibling imageFit field, e.g.
  // InfoCards' "Resize image to fit".
  ownsImageFitField?: boolean
}
