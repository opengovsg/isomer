import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { Transaction } from "@tiptap/pm/state"
import {
  TABLE_COLUMN_WIDTH_DEFAULT_PX,
  validateTableColumnWidths,
} from "@opengovsg/isomer-components"
import { TableMap } from "@tiptap/pm/tables"

const readStoredColumnWidths = (table: ProseMirrorNode): number[] | null => {
  const raw = table.attrs.columnWidths
  return Array.isArray(raw) ? [...raw] : null
}

export const getValidatedTableColumnWidths = (
  table: ProseMirrorNode,
): number[] | null => {
  const map = TableMap.get(table)
  return validateTableColumnWidths(readStoredColumnWidths(table), map.width)
}

const withStoredColumnWidths = (
  table: ProseMirrorNode,
  mutate: (widths: number[]) => number[],
): number[] | null => {
  const stored = readStoredColumnWidths(table)
  if (!stored) return null
  return mutate(stored)
}

export const setTableColumnWidthsOnTransaction = ({
  tr,
  tablePos,
  columnWidths,
}: {
  tr: Transaction
  tablePos: number
  columnWidths: number[] | null
}): Transaction => {
  const table = tr.doc.nodeAt(tablePos)
  if (!table || table.type.name !== "table") return tr
  return tr.setNodeMarkup(tablePos, undefined, {
    ...table.attrs,
    columnWidths,
  })
}

export const insertTableColumnWidth = (
  widths: number[],
  index: number,
  width = TABLE_COLUMN_WIDTH_DEFAULT_PX,
): number[] => {
  const next = [...widths]
  next.splice(index, 0, width)
  return next
}

export const removeTableColumnWidth = (
  widths: number[],
  index: number,
): number[] => {
  const next = [...widths]
  next.splice(index, 1)
  return next
}

export const moveTableColumnWidth = (
  widths: number[],
  from: number,
  to: number,
): number[] => {
  const next = [...widths]
  const [moved] = next.splice(from, 1)
  if (moved === undefined) return widths
  next.splice(to, 0, moved)
  return next
}

export const duplicateTableColumnWidth = (
  widths: number[],
  sourceIndex: number,
  insertAt: number,
): number[] => {
  const source = widths[sourceIndex] ?? TABLE_COLUMN_WIDTH_DEFAULT_PX
  return insertTableColumnWidth(widths, insertAt, source)
}

export const syncTableColumnWidthsAfterAdd = ({
  tr,
  tablePos,
  index,
}: {
  tr: Transaction
  tablePos: number
  index: number
}): Transaction => {
  const table = tr.doc.nodeAt(tablePos)
  if (!table) return tr
  const next = withStoredColumnWidths(table, (widths) =>
    insertTableColumnWidth(widths, index),
  )
  if (!next) return tr
  return setTableColumnWidthsOnTransaction({
    tr,
    tablePos,
    columnWidths: next,
  })
}

export const syncTableColumnWidthsAfterDelete = ({
  tr,
  tablePos,
  index,
}: {
  tr: Transaction
  tablePos: number
  index: number
}): Transaction => {
  const table = tr.doc.nodeAt(tablePos)
  if (!table) return tr
  const next = withStoredColumnWidths(table, (widths) =>
    removeTableColumnWidth(widths, index),
  )
  if (!next) return tr
  return setTableColumnWidthsOnTransaction({
    tr,
    tablePos,
    columnWidths: next,
  })
}

export const syncTableColumnWidthsAfterMove = ({
  tr,
  tablePos,
  from,
  to,
}: {
  tr: Transaction
  tablePos: number
  from: number
  to: number
}): Transaction => {
  const table = tr.doc.nodeAt(tablePos)
  if (!table) return tr
  const next = withStoredColumnWidths(table, (widths) =>
    moveTableColumnWidth(widths, from, to),
  )
  if (!next) return tr
  return setTableColumnWidthsOnTransaction({
    tr,
    tablePos,
    columnWidths: next,
  })
}

export const syncTableColumnWidthsAfterDuplicate = ({
  tr,
  tablePos,
  sourceCol,
  insertAt,
}: {
  tr: Transaction
  tablePos: number
  sourceCol: number
  insertAt: number
}): Transaction => {
  const table = tr.doc.nodeAt(tablePos)
  if (!table) return tr
  const next = withStoredColumnWidths(table, (widths) =>
    duplicateTableColumnWidth(widths, sourceCol, insertAt),
  )
  if (!next) return tr
  return setTableColumnWidthsOnTransaction({
    tr,
    tablePos,
    columnWidths: next,
  })
}

export const resetTableColumnWidths = ({
  tr,
  tablePos,
}: {
  tr: Transaction
  tablePos: number
}): Transaction =>
  setTableColumnWidthsOnTransaction({ tr, tablePos, columnWidths: null })
