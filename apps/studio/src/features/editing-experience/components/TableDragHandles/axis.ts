import type { Node as ProseMirrorNode, ResolvedPos } from "@tiptap/pm/model"
import type { Command } from "@tiptap/pm/state"
import type { Rect } from "~/features/editing-experience/utils/tableEditorGeometry"
import {
  CellSelection,
  moveTableColumn,
  moveTableRow,
  TableMap,
} from "@tiptap/pm/tables"
import {
  COL_HANDLE,
  ROW_HANDLE,
} from "~/features/editing-experience/utils/tableEditorChrome"

import {
  selectionIncludesHeaderColumn,
  selectionIncludesHeaderRow,
} from "../TableBubbleMenu/TableBubbleMenu.utils"

export type Axis = "row" | "column"

export const AXES = ["row", "column"] as const satisfies readonly Axis[]

// Rows and columns differ only in which coordinate they run along and which
// prosemirror-tables command they dispatch. Describing that difference once
// keeps every handle, boundary and drop calculation axis-agnostic.
export interface AxisSpec {
  handle: { w: number; h: number }
  selectLabel: string
  dragLabel: string
  addPillLabel: string
  /** Where a slot starts along the axis. */
  startOf: (rect: Rect) => number
  /** How long a slot is along the axis. */
  sizeOf: (rect: Rect) => number
  /** The pointer coordinate that matters for this axis. */
  pointerOf: (point: { x: number; y: number }) => number
  /** First index that may not be reordered — 1 when the axis has a header. */
  lockMinIndex: (table: ProseMirrorNode) => number
  /** Offset of the first cell in slot `index`, relative to the table start. */
  cellOffsetAt: (map: TableMap, table: ProseMirrorNode, index: number) => number
  /** Offset of the first cell in the last slot, used by the add pills. */
  lastCellOffset: (map: TableMap, table: ProseMirrorNode) => number
  cellSelection: ($cell: ResolvedPos) => CellSelection
  move: (options: { from: number; to: number; pos: number }) => Command
}

export const AXIS: Record<Axis, AxisSpec> = {
  row: {
    handle: ROW_HANDLE,
    selectLabel: "Select row",
    dragLabel: "Drag to reorder row",
    addPillLabel: "Add row below",
    startOf: (rect) => rect.top,
    sizeOf: (rect) => rect.height,
    pointerOf: (point) => point.y,
    lockMinIndex: (table) =>
      selectionIncludesHeaderRow({
        top: 0,
        left: 0,
        map: TableMap.get(table),
        table,
      })
        ? 1
        : 0,
    cellOffsetAt: (map, table, index) => map.positionAt(index, 0, table),
    lastCellOffset: (map, table) => map.positionAt(map.height - 1, 0, table),
    cellSelection: ($cell) => CellSelection.rowSelection($cell),
    move: moveTableRow,
  },
  column: {
    handle: COL_HANDLE,
    selectLabel: "Select column",
    dragLabel: "Drag to reorder column",
    addPillLabel: "Add column to the right",
    startOf: (rect) => rect.left,
    sizeOf: (rect) => rect.width,
    pointerOf: (point) => point.x,
    lockMinIndex: (table) =>
      selectionIncludesHeaderColumn({
        top: 0,
        left: 0,
        map: TableMap.get(table),
        table,
      })
        ? 1
        : 0,
    cellOffsetAt: (map, table, index) => map.positionAt(0, index, table),
    lastCellOffset: (map, table) => map.positionAt(0, map.width - 1, table),
    cellSelection: ($cell) => CellSelection.colSelection($cell),
    move: moveTableColumn,
  },
}

/** Resolves the table at `tablePos`, or null when the position moved on. */
export const getTableAt = (
  doc: ProseMirrorNode,
  tablePos: number,
): ProseMirrorNode | null => {
  const table = doc.nodeAt(tablePos)
  return table && table.type.name === "table" ? table : null
}

export const getAxisLockMinIndex = (
  doc: ProseMirrorNode,
  tablePos: number,
  axis: Axis,
): number => {
  const table = getTableAt(doc, tablePos)
  return table ? AXIS[axis].lockMinIndex(table) : 0
}
