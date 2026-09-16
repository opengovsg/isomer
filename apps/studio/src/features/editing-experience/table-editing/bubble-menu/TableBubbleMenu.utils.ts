import type { Node } from "@tiptap/pm/model"
import type { Transaction } from "@tiptap/pm/state"
import type { EditorView } from "@tiptap/pm/view"
import type { Editor } from "@tiptap/react"
import type { Axis } from "~/features/editing-experience/table-editing/axis"
import {
  CellSelection,
  deleteCellSelection,
  selectedRect,
  TableMap,
} from "@tiptap/pm/tables"

import type { SelectionKind, TableMovePlan } from "./TableBubbleMenu.types"

interface TableSelectionFacts {
  spansEntireTableWidth: boolean
  spansEntireTableHeight: boolean
  allCellsAreHeaders: boolean
  isTopRow: boolean
  isLeftmostColumn: boolean
  selectsSingleCellNode: boolean
  selectedCellIsMerged: boolean
}

type MovedBlockTableMap = Pick<TableMap, "width" | "height" | "positionAt">

export const selectionIsTopRow = (rect: {
  top: number
  bottom: number
}): boolean => rect.top === 0 && rect.bottom === 1

export const selectionIsLeftmostColumn = (rect: {
  left: number
  right: number
}): boolean => rect.left === 0 && rect.right === 1

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

export const getSlotMovePlan = (
  axis: Axis,
  rect: {
    top: number
    bottom: number
    left: number
    right: number
    map: { width: number; height: number }
  },
  direction: "backward" | "forward",
): TableMovePlan | null => {
  const start = axis === "row" ? rect.top : rect.left
  const end = axis === "row" ? rect.bottom : rect.right
  const tableSize = axis === "row" ? rect.map.height : rect.map.width
  const span = end - start

  if (direction === "backward") {
    if (start === 0) return null
    return {
      from: start - 1,
      to: end - 1,
      newStart: start - 1,
      span,
    }
  }

  if (end >= tableSize) return null
  return {
    from: end,
    to: start,
    newStart: start + 1,
    span,
  }
}

export const getMovedBlockCellCorners = (
  map: MovedBlockTableMap,
  table: Node,
  plan: TableMovePlan,
  axis: Axis,
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

export const restoreMovedBlockSelection = (
  view: EditorView,
  tr: Transaction,
  tablePos: number,
  plan: TableMovePlan,
  axis: Axis,
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

export const clearSelectedCells = (editor: Editor): void => {
  const { state, view } = editor
  const { selection } = state
  if (!(selection instanceof CellSelection)) return

  deleteCellSelection(state, (tr) => {
    const anchor = tr.mapping.map(selection.$anchorCell.pos)
    const head = tr.mapping.map(selection.$headCell.pos)
    view.dispatch(tr.setSelection(CellSelection.create(tr.doc, anchor, head)))
  })
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

export const detectTableSelectionKind = (editor: Editor): SelectionKind => {
  const { selection } = editor.state
  if (!(selection instanceof CellSelection)) return "none"

  const rect = selectedRect(editor.state)

  let allHeader = true
  selection.forEachCell((node) => {
    if (node.type.name !== "tableHeader") {
      allHeader = false
    }
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

// Hide while a modal dialog has focus.
export const isEditorModalOpen = () =>
  document.querySelector('[role="dialog"][aria-modal="true"]') != null
