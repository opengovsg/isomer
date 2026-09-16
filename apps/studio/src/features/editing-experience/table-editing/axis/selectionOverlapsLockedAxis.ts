import type { MappedTable } from "./mappedTable"
import type { Axis } from "./types"
import { hasHeaderColumn, hasHeaderRow } from "./headerDetection"

/** selectedRect() fields used for header overlap checks. */
export interface TableHeaderOverlapRect extends MappedTable {
  top: number
  left: number
}

/** True when the selection overlaps a locked header row or column. */
export const selectionOverlapsLockedAxis = (
  rect: TableHeaderOverlapRect,
  axis: Axis,
): boolean =>
  axis === "row"
    ? rect.top === 0 && hasHeaderRow(rect)
    : rect.left === 0 && hasHeaderColumn(rect)
