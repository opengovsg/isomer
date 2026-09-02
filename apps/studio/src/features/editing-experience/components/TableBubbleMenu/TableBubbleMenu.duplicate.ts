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

import {
  selectionIncludesHeaderColumn,
  selectionIncludesHeaderRow,
} from "./TableBubbleMenu.utils"

/**
 * Duplicate selected rows/columns with cell content preserved.
 *
 * prosemirror-tables (via `@tiptap/pm/tables`) ships `addRow` / `addColumn` but
 * no duplicate. Those commands insert empty cells (`createAndFill`). The insert
 * loops below mirror that package's TableMap handling; we reference source content
 * instead and flatten merges along the duplicate axis.
 *
 * @see https://github.com/ProseMirror/prosemirror-tables/blob/v1.8.5/src/commands.ts
 *      (`addRow`, `addColumn`)
 */

interface TableInfo {
  map: TableMap
  tableStart: number
  table: Node
}

interface ResolvedCell {
  pos: number
  node: Node
}

type SelectionRect = ReturnType<typeof selectedRect>

const tableInfoAt = ({
  tr,
  tablePos,
}: {
  tr: Transaction
  tablePos: number
}): TableInfo | null => {
  const table = tr.doc.nodeAt(tablePos)
  if (!table) return null
  return {
    table,
    tableStart: tablePos + 1,
    map: TableMap.get(table),
  }
}

const resolveCell = ({
  table,
  map,
  index,
}: {
  table: Node
  map: TableMap
  index: number
}): ResolvedCell | null => {
  const pos = map.map[index]
  if (pos === undefined) return null
  const node = table.nodeAt(pos)
  if (!node) return null
  return { pos, node }
}

const isSlotCoveredFromRowAbove = ({
  map,
  insertAt,
  col,
}: {
  map: TableMap
  insertAt: number
  col: number
}): boolean => {
  const insertIndex = insertAt * map.width + col
  return (
    insertAt > 0 &&
    insertAt < map.height &&
    map.map[insertIndex] === map.map[insertIndex - map.width]
  )
}

const isSlotCoveredFromColumnLeft = ({
  map,
  row,
  insertAt,
}: {
  map: TableMap
  row: number
  insertAt: number
}): boolean => {
  const insertIndex = row * map.width + insertAt
  return (
    insertAt > 0 &&
    insertAt < map.width &&
    map.map[insertIndex - 1] === map.map[insertIndex]
  )
}

const isSourceRowOwned = ({
  map,
  sourcePos,
  sourceRow,
}: {
  map: TableMap
  sourcePos: number
  sourceRow: number
}): boolean => map.findCell(sourcePos).top === sourceRow

const isSourceColumnOwned = ({
  map,
  sourcePos,
  sourceCol,
}: {
  map: TableMap
  sourcePos: number
  sourceCol: number
}): boolean => map.findCell(sourcePos).left === sourceCol

const placeholderCell = (sourceCell: Node): Node | null =>
  sourceCell.type.createAndFill({
    ...sourceCell.attrs,
    rowspan: 1,
    colspan: 1,
    colwidth: null,
  })

const cloneCellForRowDuplicate = (sourceCell: Node): Node =>
  sourceCell.type.create(
    { ...sourceCell.attrs, rowspan: 1 },
    sourceCell.content,
  )

const cloneCellForColumnDuplicate = (sourceCell: Node): Node => {
  const colwidth = sourceCell.attrs.colwidth as number[] | null
  return sourceCell.type.create(
    {
      ...sourceCell.attrs,
      colspan: 1,
      colwidth: colwidth ? [colwidth[0] ?? 0] : null,
    },
    sourceCell.content,
  )
}

const expandRowspan = ({
  tr,
  tableStart,
  cell,
}: {
  tr: Transaction
  tableStart: number
  cell: ResolvedCell
}): void => {
  tr.setNodeMarkup(tableStart + cell.pos, null, {
    ...cell.node.attrs,
    rowspan: (cell.node.attrs.rowspan as number) + 1,
  })
}

const expandColspan = ({
  tr,
  tableStart,
  map,
  cell,
  insertAt,
}: {
  tr: Transaction
  tableStart: number
  map: TableMap
  cell: ResolvedCell
  insertAt: number
}): void => {
  tr.setNodeMarkup(
    tableStart + cell.pos,
    null,
    addColSpan(
      cell.node.attrs as Parameters<typeof addColSpan>[0],
      insertAt - map.colCount(cell.pos),
    ),
  )
}

const selectBlockAndDispatch = ({
  editor,
  tr,
  tablePos,
  corners,
}: {
  editor: Editor
  tr: Transaction
  tablePos: number
  corners: (info: TableInfo) => { anchor: number; head: number }
}): void => {
  const info = tableInfoAt({ tr, tablePos })
  if (info) {
    const { anchor, head } = corners(info)
    tr.setSelection(
      CellSelection.create(
        tr.doc,
        info.tableStart + anchor,
        info.tableStart + head,
      ),
    )
  }
  editor.view.dispatch(tr)
  // Unlike sibling actions, this dispatches its own transaction instead of
  // `.chain().focus()...run()`. Refocus the editor so a mousedown blur on the
  // button does not leave focus stranded there.
  editor.commands.focus()
}

// Same TableMap loop as prosemirror-tables `addRow`, but references source content.
const insertDuplicateRow = ({
  tr,
  info: { map, tableStart, table },
  sourceRow,
  insertAt,
}: {
  tr: Transaction
  info: TableInfo
  sourceRow: number
  insertAt: number
}): Transaction => {
  let rowPos = tableStart
  for (let i = 0; i < insertAt; i++) {
    rowPos += table.child(i).nodeSize
  }

  const cells: Node[] = []
  for (let col = 0; col < map.width;) {
    if (isSlotCoveredFromRowAbove({ map, insertAt, col })) {
      const resolved = resolveCell({
        table,
        map,
        index: insertAt * map.width + col,
      })
      if (!resolved) {
        col += 1
        continue
      }
      expandRowspan({ tr, tableStart, cell: resolved })
      col += resolved.node.attrs.colspan as number
      continue
    }

    const resolvedSource = resolveCell({
      table,
      map,
      index: sourceRow * map.width + col,
    })
    if (!resolvedSource) {
      col += 1
      continue
    }
    const { node: sourceCell, pos: sourcePos } = resolvedSource

    if (!isSourceRowOwned({ map, sourcePos, sourceRow })) {
      const cell = placeholderCell(sourceCell)
      if (cell) cells.push(cell)
      col += 1
      continue
    }

    cells.push(cloneCellForRowDuplicate(sourceCell))
    col += sourceCell.attrs.colspan as number
  }

  tr.insert(rowPos, tableNodeTypes(table.type.schema).row.create(null, cells))
  return tr
}

// Same TableMap loop as prosemirror-tables `addColumn`, but references source content.
// Refreshes the map each row because column inserts shift later positions.
const insertDuplicateColumn = ({
  tr,
  tablePos,
  sourceCol,
  insertAt,
}: {
  tr: Transaction
  tablePos: number
  sourceCol: number
  insertAt: number
}): boolean => {
  let row = 0

  while (true) {
    const info = tableInfoAt({ tr, tablePos })
    if (!info) return false

    const { map, tableStart, table } = info
    if (row >= map.height) return true

    if (isSlotCoveredFromColumnLeft({ map, row, insertAt })) {
      const resolved = resolveCell({
        table,
        map,
        index: row * map.width + insertAt,
      })
      if (!resolved) {
        row += 1
        continue
      }
      expandColspan({ tr, tableStart, map, cell: resolved, insertAt })
      row += resolved.node.attrs.rowspan as number
      continue
    }

    const resolvedSource = resolveCell({
      table,
      map,
      index: row * map.width + sourceCol,
    })
    if (!resolvedSource) {
      row += 1
      continue
    }
    const { node: sourceCell, pos: sourcePos } = resolvedSource
    const insertPos = map.positionAt(row, insertAt, table)
    const rowspan = sourceCell.attrs.rowspan as number

    if (!isSourceColumnOwned({ map, sourcePos, sourceCol })) {
      const cell = placeholderCell(sourceCell)
      if (cell) {
        tr.insert(tableStart + insertPos, cell)
      }
      row += 1
      continue
    }

    tr.insert(tableStart + insertPos, cloneCellForColumnDuplicate(sourceCell))
    row += rowspan
  }
}

const duplicateSelectedBlock = ({
  editor,
  rect,
  span,
  mutate,
  selectCorners,
}: {
  editor: Editor
  rect: SelectionRect
  span: number
  mutate: (args: { tr: Transaction; tablePos: number }) => Transaction | false
  selectCorners: (args: { info: TableInfo; rect: SelectionRect }) => {
    anchor: number
    head: number
  }
}): void => {
  if (span <= 0) return

  const tablePos = rect.tableStart - 1
  const result = mutate({ tr: editor.state.tr, tablePos })
  if (result === false) return

  selectBlockAndDispatch({
    editor,
    tr: result,
    tablePos,
    corners: (info) => selectCorners({ info, rect }),
  })
}

export const duplicateSelectedRows = (editor: Editor): void => {
  if (!isInTable(editor.state)) return

  const rect = selectedRect(editor.state)
  if (selectionIncludesHeaderRow(rect)) return
  const span = rect.bottom - rect.top

  duplicateSelectedBlock({
    editor,
    rect,
    span,
    mutate: ({ tr, tablePos }) => {
      let next = tr
      for (
        let sourceRow = rect.bottom - 1;
        sourceRow >= rect.top;
        sourceRow--
      ) {
        const info = tableInfoAt({ tr: next, tablePos })
        if (!info) return false
        next = insertDuplicateRow({
          tr: next,
          info,
          sourceRow,
          insertAt: rect.bottom,
        })
      }
      return next
    },
    selectCorners: ({ info, rect: selectionRect }) => ({
      anchor: info.map.positionAt(selectionRect.bottom, 0, info.table),
      head: info.map.positionAt(
        selectionRect.bottom + span - 1,
        info.map.width - 1,
        info.table,
      ),
    }),
  })
}

export const duplicateSelectedColumns = (editor: Editor): void => {
  if (!isInTable(editor.state)) return

  const rect = selectedRect(editor.state)
  if (selectionIncludesHeaderColumn(rect)) return
  const span = rect.right - rect.left

  duplicateSelectedBlock({
    editor,
    rect,
    span,
    mutate: ({ tr, tablePos }) => {
      for (let i = 0; i < span; i++) {
        if (
          !insertDuplicateColumn({
            tr,
            tablePos,
            sourceCol: rect.left + i,
            insertAt: rect.right + i,
          })
        ) {
          return false
        }
      }
      return tr
    },
    selectCorners: ({ info, rect: selectionRect }) => ({
      anchor: info.map.positionAt(
        info.map.height - 1,
        selectionRect.right,
        info.table,
      ),
      head: info.map.positionAt(0, selectionRect.right + span - 1, info.table),
    }),
  })
}
