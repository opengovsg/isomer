import type { MappedTable } from "./mappedTable"
import type { Axis } from "./types"
import { hasHeaderColumn, hasHeaderRow } from "./headerDetection"

/** First slot index that can move. Returns 1 when that axis has a locked header row or column. */
export const getAxisLockMinIndex = (
  mapped: MappedTable,
  axis: Axis,
): number => {
  if (axis === "row" && hasHeaderRow(mapped)) return 1
  if (axis === "column" && hasHeaderColumn(mapped)) return 1
  return 0
}

export const isSlotLocked = (
  axis: Axis,
  index: number,
  mapped: MappedTable,
): boolean => index < getAxisLockMinIndex(mapped, axis)
