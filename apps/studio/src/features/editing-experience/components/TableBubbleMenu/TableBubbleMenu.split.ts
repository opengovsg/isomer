import type { Editor } from "@tiptap/react"
import { Fragment, type Node, type NodeType } from "@tiptap/pm/model"
import { TableMap } from "@tiptap/pm/tables"
import {
  hasHeaderColumn,
  hasHeaderRow,
} from "~/features/editing-experience/utils/tableHeaderAxis"

import { type TableSelectionRect } from "./TableBubbleMenu.utils"

// TipTap's splitCell() keeps every block in the first cell. A merge that spans
// only columns, or only rows, is rebuilt so each block goes to one cell along
// that span. A rectangle stays on splitCell.

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

const splitCellAttrs = (cell: Node, colwidthIndex = 0) => {
  const colwidth = cell.attrs.colwidth as number[] | null
  const width = colwidth?.[colwidthIndex]
  return {
    ...cell.attrs,
    colspan: 1,
    rowspan: 1,
    colwidth: width ? [width] : null,
  }
}

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

const buildRowCellsAfterHorizontalSplit = ({
  table,
  map,
  rowIndex,
  splitLeft,
  splitRight,
  blocks,
  sourceCell,
  tableCell,
  tableHeader,
  paragraph,
}: {
  table: Node
  map: TableMap
  rowIndex: number
  splitLeft: number
  splitRight: number
  blocks: Node[]
  sourceCell: Node
  tableCell: NodeType
  tableHeader: NodeType
  paragraph: NodeType
}): Node[] => {
  const cells: Node[] = []
  const slotCount = splitRight - splitLeft
  const cellType =
    sourceCell.type.name === "tableHeader" ? tableHeader : tableCell

  for (let col = 0; col < map.width;) {
    if (col >= splitLeft && col < splitRight) {
      const slotIndex = col - splitLeft
      cells.push(
        cellType.create(
          splitCellAttrs(sourceCell, slotIndex),
          contentForSplitSlot({
            blocks,
            slotIndex,
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
    if (
      !resolved ||
      !isRowOwnedCell({ map, cellPos: resolved.pos, rowIndex })
    ) {
      col += resolved ? (resolved.node.attrs.colspan as number) : 1
      continue
    }

    cells.push(resolved.node)
    col += resolved.node.attrs.colspan as number
  }

  return cells
}

export const splitFullyMergedRow = (
  editor: Editor,
  rect: TableSelectionRect,
): boolean => {
  if (rect.bottom - rect.top !== 1) return false

  const { state, view } = editor
  const tablePos = rect.tableStart - 1
  const table = state.doc.nodeAt(tablePos)
  if (!table) return false

  const map = TableMap.get(table)
  const cellOffset = map.map[rect.top * map.width + rect.left]
  if (cellOffset === undefined) return false

  const sourceCell = table.nodeAt(cellOffset)
  if (!sourceCell) return false
  const colspan = sourceCell.attrs.colspan as number
  const rowspan = sourceCell.attrs.rowspan as number
  if (rowspan !== 1 || colspan <= 1 || rect.right - rect.left !== colspan) {
    return false
  }

  const blocks = cellBlocks(sourceCell)
  const { paragraph, tableCell, tableHeader } = state.schema.nodes
  if (!paragraph || !tableCell || !tableHeader) return false

  const rowNode = table.child(rect.top)
  const newRow = rowNode.type.create(
    rowNode.attrs,
    buildRowCellsAfterHorizontalSplit({
      table,
      map,
      rowIndex: rect.top,
      splitLeft: rect.left,
      splitRight: rect.right,
      blocks,
      sourceCell,
      tableCell,
      tableHeader,
      paragraph,
    }),
  )
  const rowPos = rowPosInDoc(tablePos, table, rect.top)
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
  if (rect.right - rect.left !== 1) return false

  const { state, view } = editor
  const tablePos = rect.tableStart - 1
  const table = state.doc.nodeAt(tablePos)
  if (!table) return false

  // Plan every row from the original map. Re-reading TableMap after inserting
  // a cell into a row the source cell still spans widens the table and the
  // later replace is rejected.
  const map = TableMap.get(table)
  const cellOffset = map.map[rect.top * map.width + rect.left]
  if (cellOffset === undefined) return false

  const sourceCell = table.nodeAt(cellOffset)
  if (!sourceCell) return false
  const colspan = sourceCell.attrs.colspan as number
  const rowspan = sourceCell.attrs.rowspan as number
  if (colspan !== 1 || rowspan <= 1 || rect.bottom - rect.top !== rowspan) {
    return false
  }

  const blocks = cellBlocks(sourceCell)
  const { paragraph, tableCell, tableHeader } = state.schema.nodes
  if (!paragraph || !tableCell || !tableHeader) return false

  const plannedRows: Node[] = []
  for (let rowIndex = rect.top; rowIndex < rect.bottom; rowIndex++) {
    const rowNode = table.child(rowIndex)
    plannedRows.push(
      rowNode.type.create(
        rowNode.attrs,
        buildRowCellsAfterColumnSplit({
          table,
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
        }),
      ),
    )
  }

  let tr = state.tr
  for (let rowIndex = rect.bottom - 1; rowIndex >= rect.top; rowIndex--) {
    const rowNode = table.child(rowIndex)
    const rowPos = rowPosInDoc(tablePos, table, rowIndex)
    const newRow = plannedRows[rowIndex - rect.top]
    if (!newRow) return false
    tr = tr.replaceWith(rowPos, rowPos + rowNode.nodeSize, newRow)
  }

  view.dispatch(tr)
  editor.commands.focus()
  return true
}
