export interface TableSelectionRect {
  left: number
  top: number
  right: number
  bottom: number
  map: {
    width: number
    height: number
  }
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

  if (spanWidth === 1 && spanHeight === 1) return false
  if (spanWidth === width && spanHeight === height) return false
  return true
}
