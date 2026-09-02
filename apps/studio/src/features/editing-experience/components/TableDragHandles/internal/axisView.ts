/**
 * Everything about a row or column axis that needs no access to the document:
 * how it projects a rect onto the coordinate it runs along, and how big its
 * handle is.
 *
 * Kept apart from `axisTableOps.ts` so the presentational and arithmetic parts
 * of this module can describe an axis without importing ProseMirror.
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
