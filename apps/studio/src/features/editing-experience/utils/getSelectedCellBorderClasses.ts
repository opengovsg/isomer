export interface SelectionBorderRect {
  left: number
  top: number
  right: number
  bottom: number
}

export const SELECTED_CELL_BORDER_CLASSES = {
  top: "selectedCell-border-top",
  right: "selectedCell-border-right",
  bottom: "selectedCell-border-bottom",
  left: "selectedCell-border-left",
} as const

/**
 * Returns CSS classes for the outer edges of a cell within a rectangular
 * CellSelection. Internal seams between adjacent selected cells are omitted.
 */
export const getSelectedCellBorderClasses = (
  selectionRect: SelectionBorderRect,
  cellRect: SelectionBorderRect,
): string[] => {
  const classes: string[] = []

  if (cellRect.top === selectionRect.top) {
    classes.push(SELECTED_CELL_BORDER_CLASSES.top)
  }
  if (cellRect.right === selectionRect.right) {
    classes.push(SELECTED_CELL_BORDER_CLASSES.right)
  }
  if (cellRect.bottom === selectionRect.bottom) {
    classes.push(SELECTED_CELL_BORDER_CLASSES.bottom)
  }
  if (cellRect.left === selectionRect.left) {
    classes.push(SELECTED_CELL_BORDER_CLASSES.left)
  }

  return classes
}
