/**
 * The rect model the handles are positioned against, and every rule computed
 * from it: where a dragged slot may land, which boundary the pointer is nearest,
 * and the outer bounds of a table.
 *
 * Deliberately free of DOM and ProseMirror imports. Each axis passes in an
 * `AxisProjection` describing how it reads a rect, so the same arithmetic serves
 * rows and columns and can be exercised with plain numbers. Reading these rects
 * out of a live editor is `measure.ts`'s job.
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
 * coordinate of a rect it runs along. Satisfied by the axis descriptors in
 * `axis.ts`, but a bare object literal works just as well.
 */
export interface AxisProjection {
  /** The rects of every slot on this axis. */
  rectsOf: (geometry: TableGeometry) => (Rect | null)[]
  /** Where a slot starts along the axis. */
  startOf: (rect: Rect) => number
  /** How long a slot is along the axis. */
  sizeOf: (rect: Rect) => number
}

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

/** Span of the table derived from its rows, used to size the drop indicator. */
export const getRowSpan = (rowRects: (Rect | null)[]) => {
  const rects = rowRects.filter((r): r is Rect => !!r)
  const first = rects[0]
  const last = rects[rects.length - 1]
  if (!first || !last) return null
  return {
    left: first.left,
    width: first.width,
    top: first.top,
    height: last.top + last.height - first.top,
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

export const boundariesFromGeometry = (
  geometry: TableGeometry,
  projection: AxisProjection,
  lockMinIndex: number,
): number[] =>
  collectAxisBoundaries(projection.rectsOf(geometry), lockMinIndex, projection)

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
 * vacates its old position on the way; and a locked header axis is a floor.
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
