import { cropRectToPixels } from "~/lib/imageBake"

import type { AspectRatio } from "./AdjustmentConfig"
import type { CropRectNormalized } from "./controls/cropGeometry"
import { defaultCropRect } from "./controls/cropGeometry"

export interface LowResWarning {
  // Which axis is under-resolved — drives the "wide"/"tall" wording.
  dimension: "width" | "height"
  // Effective pixel size of the cropped region on that axis (what ships).
  effectivePx: number
  // The frame size on that axis it's being compared against.
  targetPx: number
}

/**
 * Decide whether to warn that the cropped region is too low-resolution for the
 * component's largest rendered frame. The crop is normalized to the rotated/
 * flipped ("display") image the editor cropped against, so a 90/270 rotation
 * swaps the source's natural dimensions before the crop is applied — the crop
 * width/height are then the effective output dimensions directly. `naturalSize`
 * is the source image's un-rotated natural size (what the <img> reports).
 *
 * The fit matters:
 * - **cover** (or width-only, when no height is configured): the frame is filled
 *   on both axes, so a shortfall on EITHER axis upscales (blurs) the image.
 *   Report the axis that falls furthest short.
 * - **contain**: the image is letterboxed, scaling up only until the limiting
 *   axis fills the frame, so it is upscaled ONLY when BOTH axes fall short (a
 *   wide-but-short or tall-but-narrow crop stays sharp). Report the binding axis
 *   (the one that fills first), whose ratio is the actual upscale factor.
 *
 * Returns undefined when there's nothing to warn about (no image loaded yet, no
 * frame size configured, or the crop can fill the frame at 1x).
 */
export const computeLowResWarning = ({
  naturalSize,
  crop,
  rotate,
  lockedRatio,
  maxRenderedWidthPx,
  maxRenderedHeightPx,
  objectFit = "cover",
}: {
  naturalSize?: { width: number; height: number }
  crop?: CropRectNormalized
  rotate?: 0 | 90 | 180 | 270
  lockedRatio?: AspectRatio
  maxRenderedWidthPx?: number
  maxRenderedHeightPx?: number
  objectFit?: "cover" | "contain"
}): LowResWarning | undefined => {
  if (!naturalSize) return undefined
  if (maxRenderedWidthPx == null && maxRenderedHeightPx == null)
    return undefined
  const rotatedQuarter = rotate === 90 || rotate === 270
  const displayWidth = rotatedQuarter ? naturalSize.height : naturalSize.width
  const displayHeight = rotatedQuarter ? naturalSize.width : naturalSize.height
  const effectiveCrop =
    crop ?? defaultCropRect(lockedRatio, displayWidth / displayHeight)
  const { sw: effectiveWidth, sh: effectiveHeight } = cropRectToPixels(
    effectiveCrop,
    displayWidth,
    displayHeight,
  )

  const widthShort: LowResWarning | undefined =
    maxRenderedWidthPx != null && effectiveWidth < maxRenderedWidthPx
      ? {
          dimension: "width",
          effectivePx: effectiveWidth,
          targetPx: maxRenderedWidthPx,
        }
      : undefined
  const heightShort: LowResWarning | undefined =
    maxRenderedHeightPx != null && effectiveHeight < maxRenderedHeightPx
      ? {
          dimension: "height",
          effectivePx: effectiveHeight,
          targetPx: maxRenderedHeightPx,
        }
      : undefined

  // The upscale factor on an axis is targetPx / effectivePx (>1 means blur).
  const upscale = (s: LowResWarning) => s.targetPx / s.effectivePx

  if (objectFit === "contain") {
    // Letterboxed: only blurry when BOTH axes fall short; the binding axis is
    // the one that fills first (smaller upscale ratio = the actual scale used).
    if (!widthShort || !heightShort) return undefined
    return upscale(widthShort) <= upscale(heightShort)
      ? widthShort
      : heightShort
  }

  // Cover / width-only: either axis falling short upscales — report the worst.
  const shortfalls = [widthShort, heightShort].filter(
    (s): s is LowResWarning => s != null,
  )
  if (shortfalls.length === 0) return undefined
  return shortfalls.reduce((worst, s) =>
    upscale(s) > upscale(worst) ? s : worst,
  )
}
