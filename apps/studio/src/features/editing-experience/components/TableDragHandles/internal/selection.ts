import type { Editor as TiptapEditor } from "@tiptap/react"
import { CellSelection, selectedRect, TableMap } from "@tiptap/pm/tables"

import type { Axis } from "./axisView"
import { AXIS_TABLE_OPS, getTableAt } from "./axisTableOps"

export interface SelectionHandleTarget {
  tablePos: number
  rows: number[]
  cols: number[]
}

/** Selects the whole row or column at `index`, mirroring a handle click. */
export const selectWholeSlot = (
  editor: TiptapEditor,
  tablePos: number,
  axis: Axis,
  index: number,
) => {
  const table = getTableAt(editor.state.doc, tablePos)
  if (!table) return
  const map = TableMap.get(table)
  const cellPos =
    tablePos + 1 + AXIS_TABLE_OPS[axis].cellOffsetAt(map, table, index)
  const selection = AXIS_TABLE_OPS[axis].cellSelection(
    editor.state.doc.resolve(cellPos),
  )
  editor.view.dispatch(editor.state.tr.setSelection(selection))
  editor.view.focus()
}

/** Appends a slot to the end of the axis, mirroring an add-pill click. */
export const addSlotAfter = (
  editor: TiptapEditor,
  tablePos: number,
  axis: Axis,
) => {
  if (editor.isDestroyed) return
  const table = getTableAt(editor.state.doc, tablePos)
  if (!table) return
  const map = TableMap.get(table)
  const cellPos = tablePos + 1 + AXIS_TABLE_OPS[axis].lastCellOffset(map, table)
  const chain = editor.chain().focus().setTextSelection(cellPos)
  if (axis === "row") {
    chain.addRowAfter().run()
    return
  }
  chain.addColumnAfter().run()
}

/**
 * The row or column indexes a full-axis CellSelection covers. Returns null for
 * anything else, so partial cell selections leave every handle passive.
 */
export const getSelectionHandleTarget = (
  editor: TiptapEditor,
): SelectionHandleTarget | null => {
  const { selection } = editor.state
  if (!(selection instanceof CellSelection)) return null

  const isRow = selection.isRowSelection()
  const isCol = selection.isColSelection()
  if (isRow === isCol) return null

  const rect = selectedRect(editor.state)
  const tablePos = rect.tableStart - 1
  if (isRow) {
    const rows: number[] = []
    for (let r = rect.top; r < rect.bottom; r++) rows.push(r)
    return { tablePos, rows, cols: [] }
  }
  const cols: number[] = []
  for (let c = rect.left; c < rect.right; c++) cols.push(c)
  return { tablePos, rows: [], cols }
}

export const selectionTargetsEqual = (
  previous: SelectionHandleTarget | null,
  next: SelectionHandleTarget | null,
): boolean => {
  if (previous === next) return true
  if (!previous || !next) return false
  return (
    previous.tablePos === next.tablePos &&
    previous.rows.length === next.rows.length &&
    previous.cols.length === next.cols.length &&
    previous.rows.every((r, i) => r === next.rows[i]) &&
    previous.cols.every((c, i) => c === next.cols[i])
  )
}

export const selectedIndexesFor = (
  target: SelectionHandleTarget | null,
  tablePos: number,
  axis: Axis,
): number[] => {
  if (target?.tablePos !== tablePos) return []
  return axis === "row" ? target.rows : target.cols
}
