/**
 * Row/column axis helpers that do not need the document: how a rect projects
 * onto the axis coordinate, and handle size.
 *
 * Split from `axisTableOps.ts` so layout math can run without ProseMirror.
 */

import type { AxisProjection } from "./axisMath"
import { COL_HANDLE, ROW_HANDLE } from "./chrome"

export type Axis = "row" | "column"

export const AXES = ["row", "column"] as const satisfies readonly Axis[]

export interface AxisView extends AxisProjection {
  handle: { w: number; h: number }
  /** The only label that is not a plain `${axis}` template. */
  addPillLabel: string
}

export const AXIS_VIEW: Record<Axis, AxisView> = {
  row: {
    handle: ROW_HANDLE,
    addPillLabel: "Add row below",
    rectsOf: (geometry) => geometry.rowRects,
    startOf: (rect) => rect.top,
    sizeOf: (rect) => rect.height,
    pointerOf: (point) => point.y,
  },
  column: {
    handle: COL_HANDLE,
    addPillLabel: "Add column to the right",
    rectsOf: (geometry) => geometry.colRects,
    startOf: (rect) => rect.left,
    sizeOf: (rect) => rect.width,
    pointerOf: (point) => point.x,
  },
}
