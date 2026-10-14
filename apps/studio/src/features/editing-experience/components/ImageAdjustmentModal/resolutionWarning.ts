import { cropRectToPixels, outputDimensions } from "~/lib/imageBake"

import type { AspectRatio } from "./AdjustmentConfig"
import type { CropRectNormalized } from "./controls/cropGeometry"
import { defaultCropRect } from "./controls/cropGeometry"

export interface LowResWarning {
  // Effective pixel width of the cropped region after rotation (what ships).
  effectiveWidth: number
  // The frame width it's being compared against (config.maxRenderedWidthPx).
  targetWidth: number
}

/**
 * Decide whether to warn that the cropped region is too low-resolution for the
 * component's largest rendered frame. Mirrors the bake's own crop → pixels →
 * rotate math (cropRectToPixels + outputDimensions) so the reported width
 * matches what actually ships, and uses the same default crop the control shows
 * until the editor makes a real edit. Returns undefined when there's nothing to
 * warn about (no image loaded yet, no frame width configured, or the crop can
 * fill the frame at 1x).
 */
export const computeLowResWarning = ({
  naturalSize,
  crop,
  rotate,
  lockedRatio,
  maxRenderedWidthPx,
}: {
  naturalSize?: { width: number; height: number }
  crop?: CropRectNormalized
  rotate?: 0 | 90 | 180 | 270
  lockedRatio?: AspectRatio
  maxRenderedWidthPx?: number
}): LowResWarning | undefined => {
  if (!naturalSize || maxRenderedWidthPx == null) return undefined
  const effectiveCrop =
    crop ?? defaultCropRect(lockedRatio, naturalSize.width / naturalSize.height)
  const { sw, sh } = cropRectToPixels(
    effectiveCrop,
    naturalSize.width,
    naturalSize.height,
  )
  const { width: effectiveWidth } = outputDimensions(sw, sh, rotate ?? 0)
  if (effectiveWidth >= maxRenderedWidthPx) return undefined
  return { effectiveWidth, targetWidth: maxRenderedWidthPx }
}
