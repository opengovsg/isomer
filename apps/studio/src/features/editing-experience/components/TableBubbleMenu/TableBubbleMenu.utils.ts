export type SelectionKind =
  | "none"
  | "single-cell"
  | "merged-cell"
  | "row"
  | "header-row"
  | "column"
  | "header-column"
  | "table"
  | "multi-cell"

// ProseMirror-specific selection details are normalized into these facts so
// the menu's classification rules can stay independent of editor state.
export interface TableSelectionFacts {
  spansEntireTableWidth: boolean
  spansEntireTableHeight: boolean
  allCellsAreHeaders: boolean
  selectsSingleCellNode: boolean
  selectedCellIsMerged: boolean
}

// Order matters: a whole-table selection spans both axes, and a merged cell
// can span multiple grid rows/columns while still selecting only one cell node.
export const getTableSelectionKind = ({
  spansEntireTableWidth,
  spansEntireTableHeight,
  allCellsAreHeaders,
  selectsSingleCellNode,
  selectedCellIsMerged,
}: TableSelectionFacts): Exclude<SelectionKind, "none"> => {
  if (spansEntireTableWidth && spansEntireTableHeight) return "table"
  if (spansEntireTableWidth) {
    return allCellsAreHeaders ? "header-row" : "row"
  }
  if (spansEntireTableHeight) {
    return allCellsAreHeaders ? "header-column" : "column"
  }
  if (selectsSingleCellNode) {
    return selectedCellIsMerged ? "merged-cell" : "single-cell"
  }
  return "multi-cell"
}

export interface TableMovePlan {
  // `from` is the adjacent row/column moved past the selected block.
  from: number
  // `to` is the selected block's far edge, expressed as TipTap's move target.
  to: number
  // The selected block's first row/column after the move.
  newStart: number
  // Number of rows/columns in the selected block, used to restore selection.
  span: number
}

// Bounds are half-open: `top` is included and `bottom` is excluded. TipTap's
// row mover operates on one row, so moving a block means moving its adjacent
// neighbour past the block and then reselecting the block at `newStart`.
export const getRowMovePlan = (
  {
    top,
    bottom,
    tableHeight,
  }: {
    top: number
    bottom: number
    tableHeight: number
  },
  direction: "up" | "down",
): TableMovePlan | null => {
  const span = bottom - top

  if (direction === "up") {
    // Move the row above to the block's final row.
    if (top === 0) return null
    return {
      from: top - 1,
      to: bottom - 1,
      newStart: top - 1,
      span,
    }
  }

  // Move the row below to the block's first row.
  if (bottom >= tableHeight) return null
  return {
    from: bottom,
    to: top,
    newStart: top + 1,
    span,
  }
}

// Column movement mirrors row movement. `left` is included and `right` is
// excluded; the adjacent column is moved across the selected block.
export const getColumnMovePlan = (
  {
    left,
    right,
    tableWidth,
  }: {
    left: number
    right: number
    tableWidth: number
  },
  direction: "left" | "right",
): TableMovePlan | null => {
  const span = right - left

  if (direction === "left") {
    // Move the column on the left to the block's final column.
    if (left === 0) return null
    return {
      from: left - 1,
      to: right - 1,
      newStart: left - 1,
      span,
    }
  }

  // Move the column on the right to the block's first column.
  if (right >= tableWidth) return null
  return {
    from: right,
    to: left,
    newStart: left + 1,
    span,
  }
}
