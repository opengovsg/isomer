/**
 * Everything about a row or column axis that needs no access to the document:
 * how it projects a rect onto the coordinate it runs along, how big its handle
 * is, and what the handle is called.
 *
 * Kept apart from `axisTableOps.ts` so the presentational and arithmetic parts
 * of this module can describe an axis without importing ProseMirror.
 */

import {
  COL_HANDLE,
  ROW_HANDLE,
} from "~/features/editing-experience/utils/tableEditorChrome"

import type { AxisProjection } from "./axisMath"

export type Axis = "row" | "column"

export const AXES = ["row", "column"] as const satisfies readonly Axis[]

export interface AxisView extends AxisProjection {
  handle: { w: number; h: number }
  selectLabel: string
  dragLabel: string
  addPillLabel: string
}

export const AXIS_VIEW: Record<Axis, AxisView> = {
  row: {
    handle: ROW_HANDLE,
    selectLabel: "Select row",
    dragLabel: "Drag to reorder row",
    addPillLabel: "Add row below",
    rectsOf: (geometry) => geometry.rowRects,
    startOf: (rect) => rect.top,
    sizeOf: (rect) => rect.height,
    pointerOf: (point) => point.y,
  },
  column: {
    handle: COL_HANDLE,
    selectLabel: "Select column",
    dragLabel: "Drag to reorder column",
    addPillLabel: "Add column to the right",
    rectsOf: (geometry) => geometry.colRects,
    startOf: (rect) => rect.left,
    sizeOf: (rect) => rect.width,
    pointerOf: (point) => point.x,
  },
}
