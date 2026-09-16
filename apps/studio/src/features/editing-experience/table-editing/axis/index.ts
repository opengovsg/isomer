export type { Axis } from "./types"
export { AXES } from "./types"
export type { MappedTable } from "./mappedTable"
export { toMappedTable } from "./mappedTable"
export { hasHeaderColumn, hasHeaderRow } from "./headerDetection"
export { getAxisLockMinIndex, isSlotLocked } from "./lockedSlots"
export {
  selectionOverlapsLockedColumn,
  selectionOverlapsLockedRow,
  type TableHeaderOverlapRect,
} from "./selectionOverlapsLockedAxis"
export {
  normalizeHeaderTypesAfterMove,
  shouldNormalizeHeaderAxis,
} from "./normalizeHeaderTypesAfterMove"
