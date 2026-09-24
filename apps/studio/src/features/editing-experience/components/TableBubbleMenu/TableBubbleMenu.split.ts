import type { Editor } from "@tiptap/react"
import { Fragment, type Node, type NodeType } from "@tiptap/pm/model"
import { TableMap } from "@tiptap/pm/tables"
import {
  hasHeaderColumn,
  hasHeaderRow,
} from "~/features/editing-experience/utils/tableHeaderAxis"

import {
  selectionIsFullyMergedColumn,
  selectionIsFullyMergedRow,
  type TableSelectionRect,
} from "./TableBubbleMenu.utils"

// TipTap's splitCell() only inserts empty sibling cells; these helpers rebuild
// fully merged row/column selections and preserve block content instead.

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

const resolveCellAt = ({
  table,
  map,
  index,
}: {
  table: Node
  map: TableMap
  index: number
}) => {
  const pos = map.map[index]
  if (pos === undefined) return null
  const node = table.nodeAt(pos)
  if (!node) return null
  return { pos, node }
}

const isSlotCoveredFromRowAbove = ({
  map,
  rowIndex,
  col,
}: {
  map: TableMap
  rowIndex: number
  col: number
}): boolean => {
  const index = rowIndex * map.width + col
  return (
    rowIndex > 0 &&
    rowIndex < map.height &&
    map.map[index] === map.map[index - map.width]
  )
}

const isRowOwnedCell = ({
  map,
  cellPos,
  rowIndex,
}: {
  map: TableMap
  cellPos: number
  rowIndex: number
}) => map.findCell(cellPos).top === rowIndex

const contentForSplitSlot = ({
  blocks,
  slotIndex,
  slotCount,
  paragraph,
}: {
  blocks: Node[]
  slotIndex: number
  slotCount: number
  paragraph: NodeType
}) => {
  if (slotIndex < slotCount - 1) {
    return blocks[slotIndex] ?? paragraph.create()
  }
  const tail =
    blocks.length >= slotCount
      ? blocks.slice(slotCount - 1)
      : [blocks[slotIndex] ?? paragraph.create()]
  return Fragment.from(tail.length > 0 ? tail : [paragraph.create()])
}

const splitCellTypeForSlot = ({
  table,
  map,
  rowIndex,
  col,
  tableCell,
  tableHeader,
}: {
  table: Node
  map: TableMap
  rowIndex: number
  col: number
  tableCell: NodeType
  tableHeader: NodeType
}) => {
  const mapped = { table, map }
  if (hasHeaderRow(mapped) && rowIndex === 0) return tableHeader
  if (hasHeaderColumn(mapped) && col === 0) return tableHeader
  return tableCell
}

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
    newCells.push(
      cellType.create(
        splitCellAttrs(sourceCell),
        contentForSplitSlot({
          blocks,
          slotIndex: col,
          slotCount: rect.map.width,
          paragraph,
        }),
      ),
    )
  }

  const newRow = rowNode.type.create(rowNode.attrs, newCells)
  view.dispatch(state.tr.replaceWith(rowPos, rowPos + rowNode.nodeSize, newRow))
  editor.commands.focus()
  return true
}

const buildRowCellsAfterColumnSplit = ({
  table,
  map,
  rowIndex,
  splitLeft,
  splitTop,
  splitBottom,
  blocks,
  sourceCell,
  sourceCellOffset,
  tableCell,
  tableHeader,
  paragraph,
}: {
  table: Node
  map: TableMap
  rowIndex: number
  splitLeft: number
  splitTop: number
  splitBottom: number
  blocks: Node[]
  sourceCell: Node
  sourceCellOffset: number
  tableCell: NodeType
  tableHeader: NodeType
  paragraph: NodeType
}): Node[] => {
  const cells: Node[] = []
  const slotCount = splitBottom - splitTop

  for (let col = 0; col < map.width;) {
    if (col === splitLeft) {
      const cellType = splitCellTypeForSlot({
        table,
        map,
        rowIndex,
        col: splitLeft,
        tableCell,
        tableHeader,
      })
      cells.push(
        cellType.create(
          splitCellAttrs(sourceCell),
          contentForSplitSlot({
            blocks,
            slotIndex: rowIndex - splitTop,
            slotCount,
            paragraph,
          }),
        ),
      )
      col += 1
      continue
    }

    if (isSlotCoveredFromRowAbove({ map, rowIndex, col })) {
      const covered = resolveCellAt({
        table,
        map,
        index: rowIndex * map.width + col,
      })
      if (covered) {
        col += covered.node.attrs.colspan as number
        continue
      }
    }

    const resolved = resolveCellAt({
      table,
      map,
      index: rowIndex * map.width + col,
    })
    if (!resolved) {
      col += 1
      continue
    }

    if (
      resolved.pos === sourceCellOffset &&
      rowIndex === splitTop &&
      col !== splitLeft
    ) {
      col += resolved.node.attrs.colspan as number
      continue
    }

    if (!isRowOwnedCell({ map, cellPos: resolved.pos, rowIndex })) {
      col += resolved.node.attrs.colspan as number
      continue
    }

    cells.push(resolved.node)
    col += resolved.node.attrs.colspan as number
  }

  return cells
}

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
  let tr = state.tr

  for (let rowIndex = rect.top; rowIndex < rect.bottom; rowIndex++) {
    const tableNode = tr.doc.nodeAt(tablePos)
    if (!tableNode) return false

    const map = TableMap.get(tableNode)
    const rowNode = tableNode.child(rowIndex)
    const rowPos = rowPosInDoc(tablePos, tableNode, rowIndex)
    const newCells = buildRowCellsAfterColumnSplit({
      table: tableNode,
      map,
      rowIndex,
      splitLeft: rect.left,
      splitTop: rect.top,
      splitBottom: rect.bottom,
      blocks,
      sourceCell,
      sourceCellOffset: cellOffset,
      tableCell,
      tableHeader,
      paragraph,
    })

    const newRow = rowNode.type.create(rowNode.attrs, newCells)
    tr = tr.replaceWith(rowPos, rowPos + rowNode.nodeSize, newRow)
  }

  view.dispatch(tr)
  editor.commands.focus()
  return true
}
