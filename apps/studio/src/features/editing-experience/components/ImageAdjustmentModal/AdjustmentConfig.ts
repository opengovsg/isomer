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
  // True when the field being resolved is the page-level thumbnail
  // (`page.image`) of a collection item (a CollectionPage/CollectionLink
  // resource) — the one root-level image field with no block-type ancestor
  // to key the registry off of. Set by useAdjustmentConfigForField from the
  // editor's resource type, since the field's own data has no discriminator.
  isCollectionThumbnail?: boolean
  // The parent collection's index page "Layout" setting (collection-variant
  // format: "collection" = 1-column CollectionCard, "blog" = 2-column
  // BlogCard) — fetched by useAdjustmentConfigForField since it lives on a
  // different page's content than the one being edited. Undefined while that
  // fetch is loading/unavailable; resolves to the 1-column frame in that case,
  // matching the schema's own "collection" default.
  collectionVariant?: "collection" | "blog"
}

// For an array-nested image field, builds a block that holds only the
// edited item. `editedItem` is the field host with the adjusted image
// patched in. Return undefined to use the framed-image approximation.
export type BuildSingleItemPreviewBlock = (
  ownerBlock: IsomerComponent,
  editedItem: Record<string, unknown>,
) => IsomerComponent | undefined

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
  // Replaces the generic guidelines link after preUploadCopy with "Read the
  // image guide for <guideLabel> or download a template to plan your image."
  preUploadLinks?: { guideLabel: string; templateUrl: string }
  // The width the modal warns below. Usually the widest CSS-pixel width the
  // image renders at; some configs use the recommended upload size from
  // preUploadCopy instead. Omit if the width is unbounded.
  maxRenderedWidthPx?: number
  // The tallest CSS-pixel height of that frame. Under "contain" the image
  // only upscales when both axes fall short, so the warning needs a height.
  // Omit when the height follows the width.
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
