import type { Node } from "@tiptap/pm/model"
import type { Transaction } from "@tiptap/pm/state"
import type { Editor } from "@tiptap/react"
import {
  addColSpan,
  CellSelection,
  isInTable,
  selectedRect,
  TableMap,
  tableNodeTypes,
} from "@tiptap/pm/tables"

interface TableInfo {
  map: TableMap
  tableStart: number
  table: Node
}

const tableInfoAt = (tr: Transaction, tablePos: number): TableInfo | null => {
  const table = tr.doc.nodeAt(tablePos)
  if (!table) return null
  return {
    table,
    tableStart: tablePos + 1,
    map: TableMap.get(table),
  }
}

// Insert a copy of `sourceRow` at row index `insertAt`. Cells that span into
// the insert slot from above expand their rowspan (same as addRow); every other
// column gets a rowspan-1 clone of the source cell's type and content.
const insertDuplicateRow = (
  tr: Transaction,
  { map, tableStart, table }: TableInfo,
  sourceRow: number,
  insertAt: number,
): Transaction => {
  let rowPos = tableStart
  for (let i = 0; i < insertAt; i++) {
    rowPos += table.child(i).nodeSize
  }

  const cells: Node[] = []
  for (let col = 0; col < map.width;) {
    const insertIndex = insertAt * map.width + col

    // A cell above already covers this slot — grow its rowspan instead of
    // inserting a parallel cell (mirrors prosemirror-tables' addRow).
    if (
      insertAt > 0 &&
      insertAt < map.height &&
      map.map[insertIndex] === map.map[insertIndex - map.width]
    ) {
      const pos = map.map[insertIndex]
      if (pos === undefined) {
        col += 1
        continue
      }
      const node = table.nodeAt(pos)
      if (!node) {
        col += 1
        continue
      }
      tr.setNodeMarkup(tableStart + pos, null, {
        ...node.attrs,
        rowspan: (node.attrs.rowspan as number) + 1,
      })
      col += node.attrs.colspan as number
      continue
    }

    const sourceIndex = sourceRow * map.width + col
    const sourcePos = map.map[sourceIndex]
    if (sourcePos === undefined) {
      col += 1
      continue
    }
    const sourceCell = table.nodeAt(sourcePos)
    if (!sourceCell) {
      col += 1
      continue
    }

    const sourceCellRect = map.findCell(sourcePos)
    if (sourceCellRect.top !== sourceRow) {
      // Covered by a rowspan that started above — placeholder empty cell.
      const placeholder = sourceCell.type.createAndFill({
        ...sourceCell.attrs,
        rowspan: 1,
        colspan: 1,
        colwidth: null,
      })
      if (placeholder) cells.push(placeholder)
      col += 1
      continue
    }

    // Flatten rowspan so the duplicate is a single row; keep colspan/content.
    cells.push(
      sourceCell.type.create(
        { ...sourceCell.attrs, rowspan: 1 },
        sourceCell.content,
      ),
    )
    col += sourceCell.attrs.colspan as number
  }

  tr.insert(rowPos, tableNodeTypes(table.type.schema).row.create(null, cells))
  return tr
}

// Clone one column from `sourceCol` into `insertAt`, refreshing the table map
// after every row mutation so later rows don't resolve stale positions.
const insertDuplicateColumn = (
  tr: Transaction,
  tablePos: number,
  sourceCol: number,
  insertAt: number,
): boolean => {
  let row = 0
  for (;;) {
    const info = tableInfoAt(tr, tablePos)
    if (!info) return false
    const { map, tableStart, table } = info
    if (row >= map.height) return true

    const insertIndex = row * map.width + insertAt

    if (
      insertAt > 0 &&
      insertAt < map.width &&
      map.map[insertIndex - 1] === map.map[insertIndex]
    ) {
      const pos = map.map[insertIndex]
      if (pos === undefined) {
        row += 1
        continue
      }
      const cell = table.nodeAt(pos)
      if (!cell) {
        row += 1
        continue
      }
      tr.setNodeMarkup(
        tableStart + pos,
        null,
        addColSpan(
          cell.attrs as Parameters<typeof addColSpan>[0],
          insertAt - map.colCount(pos),
        ),
      )
      row += cell.attrs.rowspan as number
      continue
    }

    const sourceIndex = row * map.width + sourceCol
    const sourcePos = map.map[sourceIndex]
    if (sourcePos === undefined) {
      row += 1
      continue
    }
    const sourceCell = table.nodeAt(sourcePos)
    if (!sourceCell) {
      row += 1
      continue
    }

    const sourceCellRect = map.findCell(sourcePos)
    const insertPos = map.positionAt(row, insertAt, table)
    const rowspan = sourceCell.attrs.rowspan as number

    if (sourceCellRect.left !== sourceCol) {
      const placeholder = sourceCell.type.createAndFill({
        ...sourceCell.attrs,
        rowspan: 1,
        colspan: 1,
        colwidth: null,
      })
      if (placeholder) {
        tr.insert(tableStart + insertPos, placeholder)
      }
      row += 1
      continue
    }

    // Flatten colspan for the duplicate column; keep rowspan/content.
    const colwidth = sourceCell.attrs.colwidth as number[] | null
    const duplicated = sourceCell.type.create(
      {
        ...sourceCell.attrs,
        colspan: 1,
        colwidth: colwidth ? [colwidth[0] ?? 0] : null,
      },
      sourceCell.content,
    )
    tr.insert(tableStart + insertPos, duplicated)
    row += rowspan
  }
}

// Duplicate the selected row block immediately below it, preserving order.
export const duplicateSelectedRows = (editor: Editor): void => {
  const { state, view } = editor
  if (!isInTable(state)) return

  const rect = selectedRect(state)
  const span = rect.bottom - rect.top
  if (span <= 0) return

  const tablePos = rect.tableStart - 1
  let tr = state.tr

  // Insert last→first at the same index so earlier sources land above later
  // ones and the duplicate block mirrors the original order.
  for (let sourceRow = rect.bottom - 1; sourceRow >= rect.top; sourceRow--) {
    const info = tableInfoAt(tr, tablePos)
    if (!info) return
    tr = insertDuplicateRow(tr, info, sourceRow, rect.bottom)
  }

  const info = tableInfoAt(tr, tablePos)
  if (!info) {
    view.dispatch(tr)
    return
  }

  const newTop = rect.bottom
  const newBottom = rect.bottom + span
  const anchor = info.map.positionAt(newTop, 0, info.table)
  const head = info.map.positionAt(
    newBottom - 1,
    info.map.width - 1,
    info.table,
  )
  tr.setSelection(
    CellSelection.create(
      tr.doc,
      info.tableStart + anchor,
      info.tableStart + head,
    ),
  )
  view.dispatch(tr)
}

// Duplicate the selected column block immediately to its right, preserving order.
export const duplicateSelectedColumns = (editor: Editor): void => {
  const { state, view } = editor
  if (!isInTable(state)) return

  const rect = selectedRect(state)
  const span = rect.right - rect.left
  if (span <= 0) return

  const tablePos = rect.tableStart - 1
  const tr = state.tr

  // Forward inserts: each copy lands after the original block + prior dups, so
  // source columns (still left of the insert point) keep stable indices.
  for (let i = 0; i < span; i++) {
    if (!insertDuplicateColumn(tr, tablePos, rect.left + i, rect.right + i)) {
      return
    }
  }

  const info = tableInfoAt(tr, tablePos)
  if (!info) {
    view.dispatch(tr)
    return
  }

  const newLeft = rect.right
  const newRight = rect.right + span
  // Bottom-left → top-right matches TipTap's full-column selection orientation.
  const anchor = info.map.positionAt(info.map.height - 1, newLeft, info.table)
  const head = info.map.positionAt(0, newRight - 1, info.table)
  tr.setSelection(
    CellSelection.create(
      tr.doc,
      info.tableStart + anchor,
      info.tableStart + head,
    ),
  )
  view.dispatch(tr)
}
