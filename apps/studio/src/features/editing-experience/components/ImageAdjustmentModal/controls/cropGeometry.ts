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

// The 8 standard crop-tool selection points. Corner handles resize both
// dimensions (anchored at the opposite corner); edge handles resize one
// dimension (anchored at the opposite edge).
export type HandlePosition = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w"

export const CORNER_HANDLES: readonly HandlePosition[] = [
  "nw",
  "ne",
  "se",
  "sw",
]
export const EDGE_HANDLES: readonly HandlePosition[] = ["n", "e", "s", "w"]

const clampUnit = (n: number): number => Math.min(1, Math.max(0, n))

interface HandleEdges {
  movesLeft: boolean
  movesTop: boolean
  movesRight: boolean
  movesBottom: boolean
}

const HANDLE_EDGES: Record<HandlePosition, HandleEdges> = {
  nw: {
    movesLeft: true,
    movesTop: true,
    movesRight: false,
    movesBottom: false,
  },
  n: {
    movesLeft: false,
    movesTop: true,
    movesRight: false,
    movesBottom: false,
  },
  ne: {
    movesLeft: false,
    movesTop: true,
    movesRight: true,
    movesBottom: false,
  },
  e: {
    movesLeft: false,
    movesTop: false,
    movesRight: true,
    movesBottom: false,
  },
  se: {
    movesLeft: false,
    movesTop: false,
    movesRight: true,
    movesBottom: true,
  },
  s: {
    movesLeft: false,
    movesTop: false,
    movesRight: false,
    movesBottom: true,
  },
  sw: {
    movesLeft: true,
    movesTop: false,
    movesRight: false,
    movesBottom: true,
  },
  w: {
    movesLeft: true,
    movesTop: false,
    movesRight: false,
    movesBottom: false,
  },
}

/**
 * Resize a rect by dragging a specific handle to a new normalized pointer
 * position. Corner handles (nw/ne/se/sw) move two edges, anchored at the
 * OPPOSITE corner, which never moves. Edge handles (n/e/s/w) move exactly one
 * edge, anchored at the opposite edge — the perpendicular dimension is
 * untouched.
 *
 * When lockedRatio is given, only corner handles should be offered by the
 * caller (resizing a single edge under a fixed ratio is ambiguous — which
 * dimension should the other derive from? — the same restriction mainstream
 * crop tools apply). The ratio-derived dimension is clamped against the room
 * available from the anchor to the image edge, so the anchor corner never
 * moves and the rect never exceeds the unit square — no separate bounds clamp
 * needed (unlike moveRect, shifting x/y here would move the anchor, which is
 * wrong for a resize).
 *
 * `imageAspect` (the source image's true pixel width/height) defaults to 1
 * (square) for backward compatibility, but MUST be passed for a correct
 * result on any non-square source: `rect.width`/`rect.height` are fractions
 * of the image's independent width/height axes, not a square unit space, so
 * `bakeImage` later multiplies them by the image's actual (possibly
 * unequal) pixel width/height — the FINAL baked pixel ratio is
 * `(rect.width/rect.height) * imageAspect`, not `rect.width/rect.height`
 * alone. To make that final ratio equal `lockedRatio`, the rect's own
 * normalized ratio must be pre-divided by `imageAspect`.
 */
export const resizeRectByHandle = (
  rect: CropRectNormalized,
  handle: HandlePosition,
  pointerX: number,
  pointerY: number,
  lockedRatio?: { width: number; height: number },
  imageAspect = 1,
): CropRectNormalized => {
  const edges = HANDLE_EDGES[handle]
  const px = clampUnit(pointerX)
  const py = clampUnit(pointerY)

  let left = rect.x
  let top = rect.y
  let right = rect.x + rect.width
  let bottom = rect.y + rect.height

  if (edges.movesLeft) left = Math.min(px, right - MIN_CROP_SIZE)
  if (edges.movesRight) right = Math.max(px, left + MIN_CROP_SIZE)
  if (edges.movesTop) top = Math.min(py, bottom - MIN_CROP_SIZE)
  if (edges.movesBottom) bottom = Math.max(py, top + MIN_CROP_SIZE)

  if (lockedRatio && CORNER_HANDLES.includes(handle)) {
    const ratio = lockedRatio.width / lockedRatio.height / imageAspect
    const anchorX = edges.movesLeft ? right : left
    const anchorY = edges.movesTop ? bottom : top
    const maxWidth = edges.movesLeft ? anchorX : 1 - anchorX
    const maxHeight = edges.movesTop ? anchorY : 1 - anchorY

    let width = Math.max(Math.abs(px - anchorX), MIN_CROP_SIZE)
    let height = width / ratio
    if (height > maxHeight) {
      height = maxHeight
      width = height * ratio
    }
    if (width > maxWidth) {
      width = maxWidth
      height = width / ratio
    }
    width = Math.max(width, MIN_CROP_SIZE)
    height = Math.max(height, MIN_CROP_SIZE)

    left = edges.movesLeft ? anchorX - width : anchorX
    right = edges.movesLeft ? anchorX : anchorX + width
    top = edges.movesTop ? anchorY - height : anchorY
    bottom = edges.movesTop ? anchorY : anchorY + height
  }

  return { x: left, y: top, width: right - left, height: bottom - top }
}

/**
 * Default starting rect: for a locked ratio, the largest centered rect of
 * that ratio that fits the unit square; otherwise the full image.
 *
 * `imageAspect` defaults to 1 (square) for backward compatibility — see the
 * matching note on `resizeRectByHandle` for why a non-square source needs it
 * passed to land the correct baked pixel ratio.
 */
export const defaultCropRect = (
  lockedRatio?: {
    width: number
    height: number
  },
  imageAspect = 1,
): CropRectNormalized => {
  if (!lockedRatio) return { x: 0, y: 0, width: 1, height: 1 }
  const ratio = lockedRatio.width / lockedRatio.height / imageAspect
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

export interface NormalizedRect {
  x: number
  y: number
  width: number
  height: number
}

/**
 * Where an image actually renders inside a box under `object-fit: contain`,
 * as a rect normalized to the BOX (not the image) — i.e. the complement of
 * this rect is the letterboxed/pillarboxed "bleed" space. Crop/focal values
 * are normalized to the IMAGE, so callers must map through this rect before
 * treating box-space pointer/percentage math as image-space — otherwise the
 * crop UI lets you drag into bleed space that doesn't exist in the real image.
 */
export const getContainedImageBounds = (
  box: { width: number; height: number },
  imageAspect: number,
): NormalizedRect => {
  if (box.width <= 0 || box.height <= 0 || !Number.isFinite(imageAspect)) {
    return { x: 0, y: 0, width: 1, height: 1 }
  }
  const boxAspect = box.width / box.height
  if (imageAspect > boxAspect) {
    // Image is relatively wider than the box: fills box width, letterboxed
    // (blank bars) top/bottom.
    const height = boxAspect / imageAspect
    return { x: 0, y: (1 - height) / 2, width: 1, height }
  }
  // Image is relatively narrower/taller than the box: fills box height,
  // pillarboxed (blank bars) left/right.
  const width = imageAspect / boxAspect
  return { x: (1 - width) / 2, y: 0, width, height: 1 }
}
