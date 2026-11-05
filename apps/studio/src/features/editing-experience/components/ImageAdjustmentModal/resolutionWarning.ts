import { cropRectToPixels } from "~/lib/imageBake"

import type { AspectRatio } from "./AdjustmentConfig"
import type { CropRectNormalized } from "./controls/cropGeometry"
import { defaultCropRect } from "./controls/cropGeometry"

interface LowResWarning {
  // Effective pixel width of the cropped region (what ships).
  effectiveWidth: number
  // The frame width it's being compared against (config.maxRenderedWidthPx).
  targetWidth: number
}

/**
 * Decide whether to warn that the cropped region is too low-resolution for the
 * component's largest rendered frame. The crop width is the effective output
 * width directly. Uses the same default crop the control shows until the
 * editor makes a real edit. Returns undefined when there's nothing to warn
 * about (no image loaded yet, no frame width configured, or the crop can fill
 * the frame at 1x).
 */
export const computeLowResWarning = ({
  naturalSize,
  crop,
  lockedRatio,
  maxRenderedWidthPx,
}: {
  naturalSize?: { width: number; height: number }
  crop?: CropRectNormalized
  lockedRatio?: AspectRatio
  maxRenderedWidthPx?: number
}): LowResWarning | undefined => {
  if (!naturalSize || maxRenderedWidthPx == null) return undefined
  const effectiveCrop =
    crop ?? defaultCropRect(lockedRatio, naturalSize.width / naturalSize.height)
  const { sw: effectiveWidth } = cropRectToPixels(
    effectiveCrop,
    naturalSize.width,
    naturalSize.height,
  )
  if (effectiveWidth >= maxRenderedWidthPx) return undefined
  return { effectiveWidth, targetWidth: maxRenderedWidthPx }
}
