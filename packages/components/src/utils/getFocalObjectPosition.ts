import type { ImageAdjustment } from "~/interfaces/complex/Image"

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
    ? `${imageAdjustment.focal.x * 100}% ${imageAdjustment.focal.y * 100}%`
    : undefined
