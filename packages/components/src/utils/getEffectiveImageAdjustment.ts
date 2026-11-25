import type { ImageAdjustment } from "~/interfaces/complex/Image"

// Focal point only applies to a "cover" thumbnail. A "contain" image,
// including the fallbacks, is letterboxed and stays centred.
export const getEffectiveImageAdjustment = (
  imageAdjustment: ImageAdjustment | undefined,
  isContainNeeded: boolean | undefined,
): ImageAdjustment | undefined =>
  isContainNeeded ? undefined : imageAdjustment
