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

export interface HeaderAxisFlags {
  preserveHeaderRow: boolean
  preserveHeaderColumn: boolean
}

export const getHeaderAxisFlags = (table: ProseMirrorNode): HeaderAxisFlags => {
  const mapped = { map: TableMap.get(table), table }
  return {
    preserveHeaderRow: hasHeaderRow(mapped),
    preserveHeaderColumn: hasHeaderColumn(mapped),
  }
}

/** Match pre-drag header axes: row drags only when a header row exists, etc. */
export const shouldNormalizeHeaderTypesAfterDrag = (
  axis: Axis,
  flags: HeaderAxisFlags,
): boolean =>
  axis === "row" ? flags.preserveHeaderRow : flags.preserveHeaderColumn

const normalizeHeaderTypes = (
  tr: Transaction,
  tablePos: number,
  table: ProseMirrorNode,
  schema: Schema,
  flags: HeaderAxisFlags,
): Transaction => {
  const { preserveHeaderRow, preserveHeaderColumn } = flags
  if (!preserveHeaderRow && !preserveHeaderColumn) return tr

  const map = TableMap.get(table)
  const wantHeaderByCellOffset = new Map<number, boolean>()

  for (let row = 0; row < map.height; row++) {
    for (let col = 0; col < map.width; col++) {
      const cellOffset = map.map[row * map.width + col]
      if (cellOffset === undefined) continue
      const slotWantsHeader =
        (preserveHeaderRow && row === 0) || (preserveHeaderColumn && col === 0)
      wantHeaderByCellOffset.set(
        cellOffset,
        (wantHeaderByCellOffset.get(cellOffset) ?? false) || slotWantsHeader,
      )
    }
  }

  for (const [cellOffset, wantHeader] of wantHeaderByCellOffset) {
    const cell = table.nodeAt(cellOffset)
    if (!cell) continue
    tr = setCellKind(tr, tablePos, cellOffset, cell, schema, wantHeader)
  }
  return tr
}

export const applyHeaderAxisNormalization = (
  tr: Transaction,
  tablePos: number,
  flags: HeaderAxisFlags,
  schema: Schema,
): Transaction => {
  const table = getTableAt(tr.doc, tablePos)
  if (!table) return tr
  return normalizeHeaderTypes(tr, tablePos, table, schema, flags)
}
