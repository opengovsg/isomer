import type { ImageAdjustment } from "@opengovsg/isomer-components"

/**
 * Default adjustment with all required fields.
 * originalKey "" is intentional — the save hook resolves the real key from the current src.
 */
export const DEFAULT_ADJUSTMENT: ImageAdjustment = {
  crop: { x: 0, y: 0, width: 1, height: 1 },
  focal: { x: 0.5, y: 0.5 },
  rotate: 0,
  flipH: false,
  flipV: false,
  originalKey: "",
}

/**
 * Ensures an adjustment exists by returning the draft or creating a default.
 */
export const ensureAdjustment = (draft?: ImageAdjustment): ImageAdjustment =>
  draft ?? DEFAULT_ADJUSTMENT
