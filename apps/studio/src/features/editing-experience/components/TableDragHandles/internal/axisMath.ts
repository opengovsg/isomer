/**
 * The rect model the handles are positioned against, and every rule computed
 * from it: where a dragged slot may land, which boundary the pointer is nearest,
 * and the outer bounds of a table.
 *
 * No DOM or ProseMirror imports. Each axis passes an `AxisProjection` that
 * reads rects its own way, so the same math works for rows and columns and
 * tests can use plain numbers. `measure.ts` reads rects from the live editor.
 */

export interface Rect {
  top: number
  left: number
  width: number
  height: number
}

/** Row and column rects for one table, in container coordinates. */
export interface TableGeometry {
  pos: number
  rowRects: (Rect | null)[]
  colRects: (Rect | null)[]
}

/**
 * How one axis reads the geometry: which rect list belongs to it, and which
 * coordinate of a rect it runs along.
 */
export interface AxisProjection {
  /** The rects of every slot on this axis. */
  rectsOf: (geometry: TableGeometry) => (Rect | null)[]
  /** Where a slot starts along the axis. */
  startOf: (rect: Rect) => number
  /** How long a slot is along the axis. */
  sizeOf: (rect: Rect) => number
  /** The pointer coordinate that matters for this axis. */
  pointerOf: (point: { x: number; y: number }) => number
}

/** The geometry of the table at `pos`, or null when it is no longer measured. */
export const geometryAt = (
  geometries: TableGeometry[],
  pos: number,
): TableGeometry | null =>
  geometries.find((geometry) => geometry.pos === pos) ?? null

/** Outer bounds of the whole table, in container coordinates. */
export const getTableBounds = (geometry: TableGeometry) => {
  const rowRects = geometry.rowRects.filter((r): r is Rect => !!r)
  const colRects = geometry.colRects.filter((r): r is Rect => !!r)
  const firstRow = rowRects[0]
  const lastRow = rowRects[rowRects.length - 1]
  const firstCol = colRects[0]
  const lastCol = colRects[colRects.length - 1]
  if (!firstRow || !lastRow || !firstCol || !lastCol) return null
  return {
    left: firstCol.left,
    top: firstRow.top,
    width: lastCol.left + lastCol.width - firstCol.left,
    height: lastRow.top + lastRow.height - firstRow.top,
  }
}

/**
 * Positions where a dragged slot may land: the leading edge of the first
 * movable slot, then the trailing edge of every slot after it.
 */
export const collectAxisBoundaries = (
  rects: (Rect | null)[],
  lockMinIndex: number,
  projection: AxisProjection,
): number[] => {
  const { startOf, sizeOf } = projection
  const boundaries: number[] = []
  rects.forEach((rect, i) => {
    if (!rect) return
    if (i === lockMinIndex) boundaries.push(startOf(rect))
    if (i >= lockMinIndex) boundaries.push(startOf(rect) + sizeOf(rect))
  })
  return boundaries
}

export const nearestBoundaryIndex = (
  pointer: number,
  boundaries: number[],
): number => {
  let closest = 0
  let closestDist = Infinity
  boundaries.forEach((boundary, i) => {
    const dist = Math.abs(boundary - pointer)
    if (dist < closestDist) {
      closestDist = dist
      closest = i
    }
  })
  return closest
}

/**
 * The slot index a drop lands on. Boundaries are indexed from the first movable
 * slot, so `lockMinIndex` shifts them back onto real slot indexes; landing past
 * the dragged slot's own trailing edge shifts back one more, because the slot
 * moves out of its old position on the way. A locked header axis is a floor.
 */
export const resolveDropIndex = ({
  pointer,
  boundaries,
  from,
  lockMinIndex,
}: {
  pointer: number
  boundaries: number[]
  from: number
  lockMinIndex: number
}): number => {
  const boundaryIndex = nearestBoundaryIndex(pointer, boundaries) + lockMinIndex
  return Math.max(
    lockMinIndex,
    boundaryIndex > from ? boundaryIndex - 1 : boundaryIndex,
  )
}
