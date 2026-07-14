import type { Node } from "@tiptap/pm/model"
import type { TableMap } from "@tiptap/pm/tables"

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

// Slice of selectedRect() needed to tell whether a selection overlaps a
// TipTap header row/column. Kept structural so unit tests don't need a live
// EditorView.
export interface TableHeaderOverlapRect {
  top: number
  left: number
  map: Pick<TableMap, "width" | "height" | "map">
  table: Node
}

const cellTypeAt = (
  rect: TableHeaderOverlapRect,
  row: number,
  col: number,
): string | null => {
  const cellPos = rect.map.map[row * rect.map.width + col]
  if (cellPos === undefined) return null
  return rect.table.nodeAt(cellPos)?.type.name ?? null
}

const isHeaderRowAtTop = (rect: TableHeaderOverlapRect): boolean => {
  for (let col = 0; col < rect.map.width; col++) {
    if (cellTypeAt(rect, 0, col) !== "tableHeader") return false
  }
  return rect.map.width > 0
}

const isHeaderColumnAtLeft = (rect: TableHeaderOverlapRect): boolean => {
  for (let row = 0; row < rect.map.height; row++) {
    if (cellTypeAt(rect, row, 0) !== "tableHeader") return false
  }
  return rect.map.height > 0
}

// Delete is withheld whenever the selection overlaps a header axis — not only
// when the selection is exclusively that header — so users unset the header
// first rather than accidentally leaving the table headerless.
export const selectionIncludesHeaderRow = (
  rect: TableHeaderOverlapRect,
): boolean => rect.top === 0 && isHeaderRowAtTop(rect)

export const selectionIncludesHeaderColumn = (
  rect: TableHeaderOverlapRect,
): boolean => rect.left === 0 && isHeaderColumnAtLeft(rect)

// ProseMirror-specific selection details are normalized into these facts so
// the menu's classification rules can stay independent of editor state.
export interface TableSelectionFacts {
  spansEntireTableWidth: boolean
  spansEntireTableHeight: boolean
  allCellsAreHeaders: boolean
  // True when the selection is exactly the table's first row / first column
  // (half-open rect starting at 0 with span 1). TipTap header toggles only
  // rewrite that edge, so "header-*" kinds match the same scope.
  isTopRow: boolean
  isLeftmostColumn: boolean
  selectsSingleCellNode: boolean
  selectedCellIsMerged: boolean
}

// Order matters: a whole-table selection spans both axes, and a merged cell
// can span multiple grid rows/columns while still selecting only one cell node.
export const getTableSelectionKind = ({
  spansEntireTableWidth,
  spansEntireTableHeight,
  allCellsAreHeaders,
  isTopRow,
  isLeftmostColumn,
  selectsSingleCellNode,
  selectedCellIsMerged,
}: TableSelectionFacts): Exclude<SelectionKind, "none"> => {
  if (spansEntireTableWidth && spansEntireTableHeight) return "table"
  if (spansEntireTableWidth) {
    return allCellsAreHeaders && isTopRow ? "header-row" : "row"
  }
  if (spansEntireTableHeight) {
    return allCellsAreHeaders && isLeftmostColumn ? "header-column" : "column"
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
