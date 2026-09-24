import type { Node } from "@tiptap/pm/model"
import type { Editor } from "@tiptap/react"
import { TableMap } from "@tiptap/pm/tables"

import {
  selectionIsFullyMergedColumn,
  selectionIsFullyMergedRow,
  type TableSelectionRect,
} from "./TableBubbleMenu.utils"

const cellBlocks = (cell: Node): Node[] => {
  const blocks: Node[] = []
  cell.content.forEach((node) => blocks.push(node))
  return blocks
}

const rowPosInDoc = (
  tablePos: number,
  table: Node,
  rowIndex: number,
): number => {
  let pos = tablePos + 1
  for (let row = 0; row < rowIndex; row++) {
    pos += table.child(row).nodeSize
  }
  return pos
}

const splitCellAttrs = (cell: Node) => ({
  ...cell.attrs,
  colspan: 1,
  rowspan: 1,
  colwidth: null,
})

/** Rebuilds a fully merged row into separate cells with block content preserved. */
export const splitFullyMergedRow = (
  editor: Editor,
  rect: TableSelectionRect,
): boolean => {
  if (!selectionIsFullyMergedRow(rect)) return false

  const mapIndex = rect.top * rect.map.width + rect.left
  const cellOffset = rect.map.map[mapIndex]
  if (cellOffset === undefined) return false

  const sourceCell = rect.table.nodeAt(cellOffset)
  if (!sourceCell) return false

  const { state, view } = editor
  const tablePos = rect.tableStart - 1
  const table = state.doc.nodeAt(tablePos)
  if (!table) return false

  const rowNode = table.child(rect.top)
  const rowPos = rowPosInDoc(tablePos, table, rect.top)
  const blocks = cellBlocks(sourceCell)
  const { paragraph, tableCell, tableHeader } = state.schema.nodes
  if (!paragraph || !tableCell || !tableHeader) return false
  const cellType =
    sourceCell.type.name === "tableHeader" ? tableHeader : tableCell

  const newCells: Node[] = []
  for (let col = 0; col < rect.map.width; col++) {
    const block = blocks[col] ?? paragraph.create()
    newCells.push(cellType.create(splitCellAttrs(sourceCell), block))
  }

  const newRow = rowNode.type.create(rowNode.attrs, newCells)
  view.dispatch(state.tr.replaceWith(rowPos, rowPos + rowNode.nodeSize, newRow))
  editor.commands.focus()
  return true
}

/** Rebuilds a fully merged column into separate cells with block content preserved. */
export const splitFullyMergedColumn = (
  editor: Editor,
  rect: TableSelectionRect,
): boolean => {
  if (!selectionIsFullyMergedColumn(rect)) return false

  const mapIndex = rect.top * rect.map.width + rect.left
  const cellOffset = rect.map.map[mapIndex]
  if (cellOffset === undefined) return false

  const sourceCell = rect.table.nodeAt(cellOffset)
  if (!sourceCell) return false

  const { state, view } = editor
  const tablePos = rect.tableStart - 1
  const table = state.doc.nodeAt(tablePos)
  if (!table) return false

  const blocks = cellBlocks(sourceCell)
  const { paragraph, tableCell, tableHeader } = state.schema.nodes
  if (!paragraph || !tableCell || !tableHeader) return false
  const cellType =
    sourceCell.type.name === "tableHeader" ? tableHeader : tableCell

  let tr = state.tr

  for (let rowIndex = rect.bottom - 1; rowIndex >= rect.top; rowIndex--) {
    const tableNode = tr.doc.nodeAt(tablePos)
    if (!tableNode) return false

    const map = TableMap.get(tableNode)
    const rowNode = tableNode.child(rowIndex)
    const rowPos = rowPosInDoc(tablePos, tableNode, rowIndex)
    const newCells: Node[] = []

    for (let colIndex = 0; colIndex < map.width; colIndex++) {
      if (colIndex === rect.left) {
        const block = blocks[rowIndex - rect.top] ?? paragraph.create()
        newCells.push(cellType.create(splitCellAttrs(sourceCell), block))
        continue
      }

      const slot = rowIndex * map.width + colIndex
      const offset = map.map[slot]
      if (offset === undefined || offset === cellOffset) continue

      const existing = tableNode.nodeAt(offset)
      if (existing) newCells.push(existing)
    }

    const newRow = rowNode.type.create(rowNode.attrs, newCells)
    tr = tr.replaceWith(rowPos, rowPos + rowNode.nodeSize, newRow)
  }

  view.dispatch(tr)
  editor.commands.focus()
  return true
}
