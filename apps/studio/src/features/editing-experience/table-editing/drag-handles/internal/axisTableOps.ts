/**
 * Row/column axis helpers that need the document: slot cells, selection, reorder.
 *
 * Prosemirror-tables adapter. Only file here that knows TableMap addresses
 * rows and columns differently.
 */

import type { Node as ProseMirrorNode, ResolvedPos } from "@tiptap/pm/model"
import type { Command } from "@tiptap/pm/state"
import {
  CellSelection,
  moveTableColumn,
  moveTableRow,
  TableMap,
} from "@tiptap/pm/tables"

import type { Axis } from "../../axis/types"

export interface AxisTableOps {
  /** Offset of the first cell in slot `index`, relative to the table start. */
  cellOffsetAt: (map: TableMap, table: ProseMirrorNode, index: number) => number
  /** Offset of the first cell in the last slot, used by the add pills. */
  lastCellOffset: (map: TableMap, table: ProseMirrorNode) => number
  cellSelection: ($cell: ResolvedPos) => CellSelection
  move: (options: { from: number; to: number; pos: number }) => Command
}

export const AXIS_TABLE_OPS: Record<Axis, AxisTableOps> = {
  row: {
    cellOffsetAt: (map, table, index) => map.positionAt(index, 0, table),
    lastCellOffset: (map, table) => map.positionAt(map.height - 1, 0, table),
    cellSelection: ($cell) => CellSelection.rowSelection($cell),
    move: moveTableRow,
  },
  column: {
    cellOffsetAt: (map, table, index) => map.positionAt(0, index, table),
    lastCellOffset: (map, table) => map.positionAt(0, map.width - 1, table),
    cellSelection: ($cell) => CellSelection.colSelection($cell),
    move: moveTableColumn,
  },
}
