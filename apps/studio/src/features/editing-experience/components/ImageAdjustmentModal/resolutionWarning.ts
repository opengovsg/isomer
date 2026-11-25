import { cropRectToPixels } from "~/lib/imageBake"

import type { AspectRatio } from "./AdjustmentConfig"
import type { CropRectNormalized } from "./controls/cropGeometry"
import { defaultCropRect } from "./controls/cropGeometry"

interface LowResWarning {
  // The under-resolved axis. Picks the "wide" or "tall" wording.
  dimension: "width" | "height"
  // Pixel size of the cropped region on that axis.
  effectivePx: number
  // Frame size on that axis.
  targetPx: number
}

/**
 * Warns when the crop has too few pixels for the component's largest frame.
 * "cover" fills both axes, so either one falling short blurs the image.
 * "contain" letterboxes, so it blurs only when both fall short.
 * Returns undefined with no image, no frame size, or a crop that fits.
 */
export const computeLowResWarning = ({
  naturalSize,
  crop,
  lockedRatio,
  maxRenderedWidthPx,
  maxRenderedHeightPx,
  objectFit = "cover",
}: {
  naturalSize?: { width: number; height: number }
  crop?: CropRectNormalized
  lockedRatio?: AspectRatio
  maxRenderedWidthPx?: number
  maxRenderedHeightPx?: number
  objectFit?: "cover" | "contain"
}): LowResWarning | undefined => {
  if (!naturalSize) return undefined
  if (maxRenderedWidthPx == null && maxRenderedHeightPx == null)
    return undefined
  const effectiveCrop =
    crop ?? defaultCropRect(lockedRatio, naturalSize.width / naturalSize.height)
  const { sw: effectiveWidth, sh: effectiveHeight } = cropRectToPixels(
    effectiveCrop,
    naturalSize.width,
    naturalSize.height,
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

  // Above 1 means the image is upscaled and blurs.
  const upscale = (s: LowResWarning) => s.targetPx / s.effectivePx

  if (objectFit === "contain") {
    // The axis with the smaller ratio fills first and sets the real scale.
    if (!widthShort || !heightShort) return undefined
    return upscale(widthShort) <= upscale(heightShort)
      ? widthShort
      : heightShort
  }

  // Report the axis that falls furthest short.
  const shortfalls = [widthShort, heightShort].filter(
    (s): s is LowResWarning => s != null,
  )
  if (shortfalls.length === 0) return undefined
  return shortfalls.reduce((worst, s) =>
    upscale(s) > upscale(worst) ? s : worst,
  )
}
