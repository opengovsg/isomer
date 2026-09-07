import type { Node as ProseMirrorNode, Schema } from "@tiptap/pm/model"
import type { Transaction } from "@tiptap/pm/state"
import { TableMap } from "@tiptap/pm/tables"
import {
  hasHeaderColumn,
  hasHeaderRow,
} from "~/features/editing-experience/utils/tableHeaderAxis"

import type { Axis } from "./axisView"
import { getTableAt } from "./axisTableOps"

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

/** After a row move, keep row 0 as header cells and demote headers elsewhere. */
export const normalizeHeaderRowTypes = (
  tr: Transaction,
  tablePos: number,
  table: ProseMirrorNode,
  schema: Schema,
): Transaction => {
  const map = TableMap.get(table)
  for (let row = 0; row < map.height; row++) {
    for (let col = 0; col < map.width; col++) {
      const cellOffset = map.map[row * map.width + col]
      if (cellOffset === undefined) continue
      const cell = table.nodeAt(cellOffset)
      if (!cell) continue
      tr = setCellKind(tr, tablePos, cellOffset, cell, schema, row === 0)
    }
  }
  return tr
}

/** After a column move, keep column 0 as header cells and demote headers elsewhere. */
export const normalizeHeaderColumnTypes = (
  tr: Transaction,
  tablePos: number,
  table: ProseMirrorNode,
  schema: Schema,
): Transaction => {
  const map = TableMap.get(table)
  for (let row = 0; row < map.height; row++) {
    for (let col = 0; col < map.width; col++) {
      const cellOffset = map.map[row * map.width + col]
      if (cellOffset === undefined) continue
      const cell = table.nodeAt(cellOffset)
      if (!cell) continue
      tr = setCellKind(tr, tablePos, cellOffset, cell, schema, col === 0)
    }
  }
  return tr
}

export const shouldNormalizeHeaderAxis = (
  table: ProseMirrorNode,
  axis: Axis,
): boolean => {
  const mapped = { map: TableMap.get(table), table }
  return axis === "row" ? hasHeaderRow(mapped) : hasHeaderColumn(mapped)
}

export const applyHeaderAxisNormalization = (
  tr: Transaction,
  tablePos: number,
  axis: Axis,
  schema: Schema,
): Transaction => {
  const table = getTableAt(tr.doc, tablePos)
  if (!table || !shouldNormalizeHeaderAxis(table, axis)) return tr
  return axis === "row"
    ? normalizeHeaderRowTypes(tr, tablePos, table, schema)
    : normalizeHeaderColumnTypes(tr, tablePos, table, schema)
}
