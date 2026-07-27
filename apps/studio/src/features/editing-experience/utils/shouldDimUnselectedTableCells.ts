export interface TableSelectionRect {
  left: number
  top: number
  right: number
  bottom: number
  map: {
    width: number
    height: number
    map: number[]
  }
}

const countSelectedCells = (rect: TableSelectionRect): number => {
  const cellStarts = new Set<number>()
  const { width, map } = rect.map

  for (let row = rect.top; row < rect.bottom; row++) {
    for (let col = rect.left; col < rect.right; col++) {
      const cellStart = map[row * width + col]
      if (cellStart !== undefined) cellStarts.add(cellStart)
    }
  }

  return cellStarts.size
}

/**
 * Whether non-selected cells should be dimmed for the current CellSelection.
 * Applies to row/column blocks and multi-cell rectangles, but not single cells
 * or a full-table selection.
 */
export const shouldDimUnselectedTableCells = (
  rect: TableSelectionRect,
): boolean => {
  const spanWidth = rect.right - rect.left
  const spanHeight = rect.bottom - rect.top
  const { width, height } = rect.map

  // Grid span can exceed 1×1 for a merged cell; count distinct cell nodes instead.
  if (countSelectedCells(rect) === 1) return false
  if (spanWidth === width && spanHeight === height) return false
  return true
}
