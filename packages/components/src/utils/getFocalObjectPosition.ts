import type { ImageAdjustment } from "~/interfaces/complex/Image"

// A normalized focal point as a CSS object-position / background-position string
// (e.g. { x: 0.5, y: 0.2 } -> "50% 20%"). Shared by the single-crop path and the
// per-tier scoped focal CSS (buildImageTierRendering).
export const focalToObjectPosition = (focal: {
  x: number
  y: number
}): string => `${focal.x * 100}% ${focal.y * 100}%`

// The focal point is emitted at render time as a CSS object-position /
// background-position string (e.g. "50% 50%"). Returns undefined when no focal
// is set, so <img>-based components fall back to their object-center class;
// callers that need a concrete CSS value (e.g. a background-position) can
// default to "center" themselves. `!= null` (not truthiness) is deliberate —
// a focal coordinate of 0 is valid.
export const getFocalObjectPosition = (
  imageAdjustment?: ImageAdjustment,
): string | undefined =>
  imageAdjustment?.focal != null
    ? focalToObjectPosition(imageAdjustment.focal)
    : undefined
