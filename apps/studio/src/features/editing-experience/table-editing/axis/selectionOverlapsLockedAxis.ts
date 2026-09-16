import type { MappedTable } from "./mappedTable"
import { hasHeaderColumn, hasHeaderRow } from "./headerDetection"

/** selectedRect() fields needed for header overlap checks (no live EditorView). */
export interface TableHeaderOverlapRect extends MappedTable {
  top: number
  left: number
}

/** Withhold delete/move when the selection overlaps a header axis. */
export const selectionOverlapsLockedRow = (
  rect: TableHeaderOverlapRect,
): boolean => rect.top === 0 && hasHeaderRow(rect)

export const selectionOverlapsLockedColumn = (
  rect: TableHeaderOverlapRect,
): boolean => rect.left === 0 && hasHeaderColumn(rect)
