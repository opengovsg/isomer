import type { ImageAdjustment } from "@opengovsg/isomer-components"

// originalKey "" is intentional — the save hook resolves the real key from the current src.
export const DEFAULT_ADJUSTMENT: ImageAdjustment = {
  crop: { x: 0, y: 0, width: 1, height: 1 },
  focal: { x: 0.5, y: 0.5 },
  originalKey: "",
}

export const ensureAdjustment = (draft?: ImageAdjustment): ImageAdjustment =>
  draft ?? DEFAULT_ADJUSTMENT
