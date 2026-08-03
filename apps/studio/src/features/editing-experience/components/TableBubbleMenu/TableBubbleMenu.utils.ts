import type { Node } from "@tiptap/pm/model"
import type { EditorState } from "@tiptap/pm/state"
import { CellSelection, selectedRect, type TableMap } from "@tiptap/pm/tables"

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

// Bounds are half-open: `start` is included and `end` is excluded. TipTap's
// row/column mover operates on a single index, so moving a block means moving
// its adjacent neighbour past the block and then reselecting the block at
// `newStart`. Row and column movement are the same algorithm along different
// axes — `getRowMovePlan`/`getColumnMovePlan` below just name the axis.
const getAxisMovePlan = (
  { start, end, extent }: { start: number; end: number; extent: number },
  direction: "backward" | "forward",
): TableMovePlan | null => {
  const span = end - start

  if (direction === "backward") {
    // Move the neighbour before the block to the block's final index.
    if (start === 0) return null
    return {
      from: start - 1,
      to: end - 1,
      newStart: start - 1,
      span,
    }
  }

  // Move the neighbour after the block to the block's first index.
  if (end >= extent) return null
  return {
    from: end,
    to: start,
    newStart: start + 1,
    span,
  }
}

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
): TableMovePlan | null =>
  getAxisMovePlan(
    { start: top, end: bottom, extent: tableHeight },
    direction === "up" ? "backward" : "forward",
  )

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
): TableMovePlan | null =>
  getAxisMovePlan(
    { start: left, end: right, extent: tableWidth },
    direction === "left" ? "backward" : "forward",
  )

// Document position of the bottom-right perimeter cell in a CellSelection.
// Used to anchor the table action trigger at the selection's outer corner.
export const getBottomRightCellDocumentPos = (
  state: EditorState,
): number | null => {
  const { selection } = state
  if (!(selection instanceof CellSelection)) return null

  const rect = selectedRect(state)
  let bottomRightPos: number | null = null

  selection.forEachCell((node, pos) => {
    const cellRect = rect.map.findCell(pos - rect.tableStart)
    if (cellRect.right === rect.right && cellRect.bottom === rect.bottom) {
      bottomRightPos = pos
    }
  })

  return bottomRightPos
}
