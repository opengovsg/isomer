import type {
  ImageAdjustment,
  IsomerComponent,
  IsomerPageLayoutType,
} from "@opengovsg/isomer-components"
import type { ReactNode } from "react"

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
}

// What a preview builder gets. The modal fills this in.
export interface AdjustmentPreviewContext {
  block: IsomerComponent
  // The object that holds the image field. It is `block` itself for a
  // root-level field, and one array item for a nested one.
  fieldHost: Record<string, unknown>
  // fieldHost's position in its array, from the form path. Undefined when
  // it is not an array item.
  itemIndex: number | undefined
  imageFieldName: string
  adjustedSrc: string
  adjustment: ImageAdjustment | undefined
  objectFit: "cover" | "contain"
}

export interface AdjustmentPreviewBuild {
  component: IsomerComponent
  // Wraps the rendered component, e.g. in a context provider. The preview
  // calls it as a plain function, so React never remounts the component.
  // It must not call hooks.
  wrapPreview?: (children: ReactNode) => ReactNode
}

// Builds what the real-component preview renders. Anything one component
// needs for its preview goes here, never in AdjustmentPreview. Return
// undefined to use the framed-image approximation.
export type BuildAdjustmentPreview = (
  ctx: AdjustmentPreviewContext,
) => AdjustmentPreviewBuild | undefined

// The field host with the adjusted image and the draft adjustment patched in.
export const withAdjustedImage = (
  ctx: AdjustmentPreviewContext,
): Record<string, unknown> => ({
  ...ctx.fieldHost,
  [ctx.imageFieldName]: ctx.adjustedSrc,
  [`${ctx.imageFieldName}ImageAdjustment`]: ctx.adjustment,
})

// The default builder. A root-level field renders the patched block. An
// array-nested field needs its own builder, since the real component would
// render every item.
export const buildRootPreview: BuildAdjustmentPreview = (ctx) =>
  ctx.fieldHost === ctx.block
    ? { component: withAdjustedImage(ctx) as unknown as IsomerComponent }
    : undefined

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
  // The widest CSS-pixel width the image renders at on the published site.
  // The modal warns when the crop is narrower. Omit if the width is unbounded.
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
  // Builds the real-component preview. Defaults to buildRootPreview.
  buildPreview?: BuildAdjustmentPreview
  // The modal's fit control writes to a sibling imageFit field, e.g.
  // InfoCards' "Resize image to fit".
  ownsImageFitField?: boolean
}
