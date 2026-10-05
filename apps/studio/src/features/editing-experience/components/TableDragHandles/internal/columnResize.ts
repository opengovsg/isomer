import type { TableGeometry } from "./axisMath"
import { getTableBounds } from "./axisMath"

export const TABLE_COLUMN_RESIZE_HIT_PX = 8
export const TABLE_COLUMN_RESIZE_LINE_PX = 2

export interface ColumnBoundaryTarget {
  tablePos: number
  columnIndex: number
  lineLeft: number
  top: number
  height: number
}

/** Trailing edge of each column; dragging boundary `i` resizes column `i`. */
export const getColumnBoundaryTargets = (
  geometry: TableGeometry,
): ColumnBoundaryTarget[] => {
  const bounds = getTableBounds(geometry)
  if (!bounds) return []

  return geometry.colRects.flatMap((rect, columnIndex) => {
    if (!rect) return []
    return [
      {
        tablePos: geometry.pos,
        columnIndex,
        lineLeft: rect.left + rect.width,
        top: bounds.top,
        height: bounds.height,
      },
    ]
  })
}

export const hitColumnBoundary = ({
  targets,
  x,
  y,
}: {
  targets: ColumnBoundaryTarget[]
  x: number
  y: number
}): ColumnBoundaryTarget | null => {
  const halfHit = TABLE_COLUMN_RESIZE_HIT_PX / 2
  for (const target of targets) {
    if (y < target.top || y > target.top + target.height) continue
    if (Math.abs(x - target.lineLeft) <= halfHit) return target
  }
  return null
}
