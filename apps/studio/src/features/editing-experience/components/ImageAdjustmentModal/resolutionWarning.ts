import { cropRectToPixels } from "~/lib/imageBake"

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
 * component's largest rendered frame. The crop is normalized to the rotated/
 * flipped ("display") image the editor cropped against, so a 90/270 rotation
 * swaps the source's natural dimensions before the crop is applied — the crop
 * width is then the effective output width directly. `naturalSize` is the
 * source image's un-rotated natural size (what the <img> reports). Uses the
 * same default crop the control shows until the editor makes a real edit.
 * Returns undefined when there's nothing to warn about (no image loaded yet, no
 * frame width configured, or the crop can fill the frame at 1x).
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
  const rotatedQuarter = rotate === 90 || rotate === 270
  const displayWidth = rotatedQuarter ? naturalSize.height : naturalSize.width
  const displayHeight = rotatedQuarter ? naturalSize.width : naturalSize.height
  const effectiveCrop =
    crop ?? defaultCropRect(lockedRatio, displayWidth / displayHeight)
  const { sw: effectiveWidth } = cropRectToPixels(
    effectiveCrop,
    displayWidth,
    displayHeight,
  )
  if (effectiveWidth >= maxRenderedWidthPx) return undefined
  return { effectiveWidth, targetWidth: maxRenderedWidthPx }
}
