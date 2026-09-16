import type { Node as ProseMirrorNode, Schema } from "@tiptap/pm/model"
import type { Transaction } from "@tiptap/pm/state"
import { TableMap } from "@tiptap/pm/tables"

import type { Axis } from "./types"
import { hasHeaderColumn, hasHeaderRow } from "./headerDetection"
import { toMappedTable } from "./mappedTable"

const getTableAt = (
  doc: ProseMirrorNode,
  tablePos: number,
): ProseMirrorNode | null => {
  const table = doc.nodeAt(tablePos)
  return table && table.type.name === "table" ? table : null
}

const setCellKind = (
  tr: Transaction,
  tablePos: number,
  cellOffset: number,
  cell: ProseMirrorNode,
  schema: Schema,
  wantHeader: boolean,
): Transaction => {
  const isHeader = cell.type.name === "tableHeader"
  if (wantHeader === isHeader) return tr
  const nextType = wantHeader
    ? schema.nodes.tableHeader
    : schema.nodes.tableCell
  if (!nextType) return tr
  return tr.setNodeMarkup(tablePos + 1 + cellOffset, nextType, cell.attrs)
}

const normalizeHeaderTypes = (
  tr: Transaction,
  tablePos: number,
  table: ProseMirrorNode,
  schema: Schema,
  axis: Axis,
): Transaction => {
  const map = TableMap.get(table)
  for (let row = 0; row < map.height; row++) {
    for (let col = 0; col < map.width; col++) {
      const cellOffset = map.map[row * map.width + col]
      if (cellOffset === undefined) continue
      const cell = table.nodeAt(cellOffset)
      if (!cell) continue
      const wantHeader = axis === "row" ? row === 0 : col === 0
      tr = setCellKind(tr, tablePos, cellOffset, cell, schema, wantHeader)
    }
  }
  return tr
}

export const shouldNormalizeHeaderAxis = (
  table: ProseMirrorNode,
  axis: Axis,
): boolean => {
  const mapped = toMappedTable(table)
  return axis === "row" ? hasHeaderRow(mapped) : hasHeaderColumn(mapped)
}

export const normalizeHeaderTypesAfterMove = (
  tr: Transaction,
  tablePos: number,
  axis: Axis,
  schema: Schema,
): Transaction => {
  const table = getTableAt(tr.doc, tablePos)
  if (!table || !shouldNormalizeHeaderAxis(table, axis)) return tr
  return normalizeHeaderTypes(tr, tablePos, table, schema, axis)
}
