import type { Node } from "@tiptap/pm/model"
import type { Transaction } from "@tiptap/pm/state"
import type { EditorView } from "@tiptap/pm/view"
import type { Editor } from "@tiptap/react"
import { CellSelection, selectedRect, TableMap } from "@tiptap/pm/tables"

import type {
  SelectionKind,
  TableMoveAxis,
  TableMovePlan,
} from "./TableBubbleMenu.types"

// Slice of selectedRect() needed to tell whether a selection overlaps a
// TipTap header row/column. Kept structural so unit tests don't need a live
// EditorView.
export interface TableHeaderOverlapRect {
  top: number
  left: number
  map: Pick<TableMap, "width" | "height" | "map">
  table: Node
}

// ProseMirror-specific selection details are normalized into these facts so
// the menu's classification rules can stay independent of editor state.
interface TableSelectionFacts {
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

type MovedBlockTableMap = Pick<TableMap, "width" | "height" | "positionAt">

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

// Half-open span: included start at 0 with extent 1 — the first row/column only.
// TipTap header toggles only rewrite that table edge.
export const selectionIsTopRow = (rect: {
  top: number
  bottom: number
}): boolean => rect.top === 0 && rect.bottom === 1

export const selectionIsLeftmostColumn = (rect: {
  left: number
  right: number
}): boolean => rect.left === 0 && rect.right === 1

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

// Column movement mirrors row movement; `left` included and `right` excluded;
// the adjacent column is moved across the selected block.
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

// CellSelection corners for a moved row/column block. Offsets are relative to
// the table node's content start (i.e. document position tableStart).
export const getMovedBlockCellCorners = (
  map: MovedBlockTableMap,
  table: Node,
  plan: TableMovePlan,
  axis: TableMoveAxis,
) => {
  const newEnd = plan.newStart + plan.span
  if (axis === "row") {
    return {
      anchor: map.positionAt(plan.newStart, 0, table),
      head: map.positionAt(newEnd - 1, map.width - 1, table),
    }
  }
  return {
    anchor: map.positionAt(map.height - 1, plan.newStart, table),
    head: map.positionAt(0, newEnd - 1, table),
  }
}

// moveTableRow/Column with select:false leaves nothing selected; reselect the
// moved block so the bubble menu stays open. Runs inside the move transaction
// callback once the table structure has been updated.
export const restoreMovedBlockSelection = (
  view: EditorView,
  tr: Transaction,
  tablePos: number,
  plan: TableMovePlan,
  axis: TableMoveAxis,
) => {
  const table = tr.doc.nodeAt(tablePos)
  if (!table) {
    view.dispatch(tr)
    return
  }
  const map = TableMap.get(table)
  const tableStart = tablePos + 1
  const { anchor, head } = getMovedBlockCellCorners(map, table, plan, axis)
  tr.setSelection(
    CellSelection.create(tr.doc, tableStart + anchor, tableStart + head),
  )
  view.dispatch(tr)
}

const isSingleCellSelection = (selection: CellSelection): boolean =>
  selection.$anchorCell.pos === selection.$headCell.pos

const isMergedCell = (rect: ReturnType<typeof selectedRect>): boolean => {
  const cellStart = rect.map.map[rect.top * rect.map.width + rect.left]
  if (cellStart === undefined) return false
  const node = rect.table.nodeAt(cellStart)
  if (!node) return false
  return (
    (node.attrs.colspan as number) > 1 || (node.attrs.rowspan as number) > 1
  )
}

// Maps the current CellSelection to a SelectionKind for action menu routing.
export const detectTableSelectionKind = (editor: Editor): SelectionKind => {
  const { selection } = editor.state
  if (!(selection instanceof CellSelection)) return "none"

  const rect = selectedRect(editor.state)

  let allHeader = true
  selection.forEachCell((node) => {
    if (node.type.name !== "tableHeader") allHeader = false
  })

  const selectsSingleCellNode = isSingleCellSelection(selection)
  return getTableSelectionKind({
    spansEntireTableWidth: rect.left === 0 && rect.right === rect.map.width,
    spansEntireTableHeight: rect.top === 0 && rect.bottom === rect.map.height,
    allCellsAreHeaders: allHeader,
    isTopRow: selectionIsTopRow(rect),
    isLeftmostColumn: selectionIsLeftmostColumn(rect),
    selectsSingleCellNode,
    selectedCellIsMerged: selectsSingleCellNode && isMergedCell(rect),
  })
}

// Ordinary single-cell text cursors show no bubble menu.
export const isActionableTableSelectionKind = (kind: SelectionKind) =>
  kind !== "none" && kind !== "single-cell"

// Hide the menu while a Chakra/modal dialog has focus.
export const isEditorModalOpen = () =>
  document.querySelector('[role="dialog"][aria-modal="true"]') != null
