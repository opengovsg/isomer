/** Handle positioning and drop math from measured rects. No DOM or ProseMirror. */

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

export interface AxisProjection {
  rectsOf: (geometry: TableGeometry) => (Rect | null)[]
  startOf: (rect: Rect) => number
  sizeOf: (rect: Rect) => number
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

/** Map pointer position to a slot index. Adjusts for lockMinIndex and the dragged slot moving. */
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
