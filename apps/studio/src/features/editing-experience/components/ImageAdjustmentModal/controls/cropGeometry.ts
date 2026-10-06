/**
 * Pure utility functions for crop rectangle geometry calculations.
 * No dependencies, fully unit-testable.
 */

export interface CropRectNormalized {
  x: number
  y: number
  width: number
  height: number
}

export const MIN_CROP_SIZE = 0.05 // avoid degenerate/zero-size crops

/**
 * Clamp a rect to stay within the unit square, preserving width/height where
 * possible by shifting x/y (not resizing) when it would overflow.
 */
export const clampRectToBounds = (
  rect: CropRectNormalized,
): CropRectNormalized => {
  const width = Math.min(Math.max(rect.width, MIN_CROP_SIZE), 1)
  const height = Math.min(Math.max(rect.height, MIN_CROP_SIZE), 1)
  const x = Math.min(Math.max(rect.x, 0), 1 - width)
  const y = Math.min(Math.max(rect.y, 0), 1 - height)
  return { x, y, width, height }
}

/**
 * Move a rect by a normalized delta, size unchanged, clamped to bounds.
 */
export const moveRect = (
  rect: CropRectNormalized,
  dx: number,
  dy: number,
): CropRectNormalized =>
  clampRectToBounds({ ...rect, x: rect.x + dx, y: rect.y + dy })

/**
 * Resize by dragging the bottom-right corner to a new normalized point,
 * anchored at the rect's existing top-left (x,y unchanged). When lockedRatio
 * is given, height is derived from width to preserve width/height = ratio,
 * re-deriving from height if that would overflow the bottom edge.
 */
export const resizeRectBottomRight = (
  rect: CropRectNormalized,
  pointerX: number,
  pointerY: number,
  lockedRatio?: { width: number; height: number },
): CropRectNormalized => {
  let width = Math.max(pointerX - rect.x, MIN_CROP_SIZE)
  let height = Math.max(pointerY - rect.y, MIN_CROP_SIZE)
  if (lockedRatio) {
    const ratio = lockedRatio.width / lockedRatio.height
    width = Math.min(width, 1 - rect.x)
    height = width / ratio
    if (rect.y + height > 1) {
      height = 1 - rect.y
      width = height * ratio
    }
  }
  return clampRectToBounds({ x: rect.x, y: rect.y, width, height })
}

/**
 * Default starting rect: for a locked ratio, the largest centered rect of
 * that ratio that fits the unit square; otherwise the full image.
 */
export const defaultCropRect = (lockedRatio?: {
  width: number
  height: number
}): CropRectNormalized => {
  if (!lockedRatio) return { x: 0, y: 0, width: 1, height: 1 }
  const ratio = lockedRatio.width / lockedRatio.height
  let width = 1
  let height = width / ratio
  if (height > 1) {
    height = 1
    width = height * ratio
  }
  return { x: (1 - width) / 2, y: (1 - height) / 2, width, height }
}

/**
 * Convert a pointer client-space delta into normalized box-space delta, given
 * the box's current pixel rect.
 */
export const clientDeltaToNormalized = (
  dxPx: number,
  dyPx: number,
  boxRect: { width: number; height: number },
): { dx: number; dy: number } => ({
  dx: boxRect.width > 0 ? dxPx / boxRect.width : 0,
  dy: boxRect.height > 0 ? dyPx / boxRect.height : 0,
})
