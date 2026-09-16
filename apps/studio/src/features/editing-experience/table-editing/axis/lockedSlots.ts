import type { MappedTable } from "./mappedTable"
import type { Axis } from "./types"
import { hasHeaderColumn, hasHeaderRow } from "./headerDetection"

/** Minimum movable slot index. Locked header slots sit below this floor. */
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
