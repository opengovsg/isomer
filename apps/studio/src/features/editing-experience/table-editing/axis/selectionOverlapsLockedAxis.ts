import type { MappedTable } from "./mappedTable"
import type { Axis } from "./types"
import { hasHeaderColumn, hasHeaderRow } from "./headerDetection"

/** selectedRect() fields needed for header overlap checks (no live EditorView). */
export interface TableHeaderOverlapRect extends MappedTable {
  top: number
  left: number
}

/** Withhold delete/move when the selection overlaps a header axis. */
export const selectionOverlapsLockedAxis = (
  rect: TableHeaderOverlapRect,
  axis: Axis,
): boolean =>
  axis === "row"
    ? rect.top === 0 && hasHeaderRow(rect)
    : rect.left === 0 && hasHeaderColumn(rect)
