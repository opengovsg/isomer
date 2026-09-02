/**
 * Every rule governing a press-and-drag on a row or column handle, as a pure
 * transition over `(state, event)`.
 *
 * A press becomes a *pending* gesture; it only becomes a *drag* once the
 * pointer travels far enough, and never for a locked header slot. Releasing a
 * pending gesture selects the slot, so handles stay clickable; releasing a drag
 * reorders. Nothing here touches the DOM, the editor or React —
 * `useAxisDragGesture` feeds it events and carries out the intents it returns.
 */

import type { AxisProjection, Rect, TableGeometry } from "./axisMath"
import type { Axis } from "./axisView"
import {
  boundariesFromGeometry,
  collectAxisBoundaries,
  geometryAt,
  resolveDropIndex,
} from "./axisMath"

/** How far the pointer must travel before a press counts as a drag. */
export const DRAG_THRESHOLD_PX = 4

/** What both live phases of a gesture remember about the slot being handled. */
interface GestureSubject {
  axis: Axis
  tablePos: number
  /** Index of the slot the gesture started on. */
  from: number
  projection: AxisProjection
  /** Snapshotted at press, refreshed if the table's layout shifts. */
  boundaries: number[]
  lockMinIndex: number
}

export interface PendingGesture extends GestureSubject {
  phase: "pending"
  startClientX: number
  startClientY: number
}

export interface DraggingGesture extends GestureSubject {
  phase: "dragging"
  /** Live pointer position along the axis, in container coordinates. */
  pointer: number
}

export type GestureState = { phase: "idle" } | PendingGesture | DraggingGesture

export const IDLE_GESTURE: GestureState = { phase: "idle" }

export type GestureEvent =
  | {
      type: "press"
      axis: Axis
      tablePos: number
      index: number
      rects: (Rect | null)[]
      projection: AxisProjection
      lockMinIndex: number
      clientX: number
      clientY: number
    }
  | {
      type: "move"
      clientX: number
      clientY: number
      /** Null when the container has gone away and cannot be measured. */
      containerPoint: { x: number; y: number } | null
    }
  | { type: "release" }
  | { type: "geometryChanged"; geometries: TableGeometry[] }

/** Work for the caller to carry out against the editor, in order. */
export type GestureIntent =
  | { type: "selectSlot"; axis: Axis; tablePos: number; index: number }
  | {
      type: "moveSlot"
      axis: Axis
      tablePos: number
      from: number
      to: number
    }
  | { type: "suppressNextClick" }

export interface GestureTransition {
  state: GestureState
  intents: GestureIntent[]
}

const NO_INTENTS: GestureIntent[] = []

// Returning the same state object signals "nothing moved", so the caller can
// skip publishing a render.
const unchanged = (state: GestureState): GestureTransition => ({
  state,
  intents: NO_INTENTS,
})

const boundariesEqual = (a: number[], b: number[]): boolean =>
  a.length === b.length && a.every((value, index) => value === b[index])

const reducePendingMove = (
  state: PendingGesture,
  event: Extract<GestureEvent, { type: "move" }>,
): GestureTransition => {
  const dx = event.clientX - state.startClientX
  const dy = event.clientY - state.startClientY
  if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return unchanged(state)
  // Header rows and columns stay put; the press still selects them.
  if (state.from < state.lockMinIndex) return unchanged(state)
  if (!event.containerPoint) return unchanged(state)

  const { startClientX: _x, startClientY: _y, ...subject } = state
  return {
    state: {
      ...subject,
      phase: "dragging",
      pointer: state.projection.pointerOf(event.containerPoint),
    },
    intents: NO_INTENTS,
  }
}

const reduceDraggingMove = (
  state: DraggingGesture,
  event: Extract<GestureEvent, { type: "move" }>,
): GestureTransition => {
  if (!event.containerPoint) return unchanged(state)
  const pointer = state.projection.pointerOf(event.containerPoint)
  // Movement perpendicular to the axis changes nothing.
  if (pointer === state.pointer) return unchanged(state)
  return { state: { ...state, pointer }, intents: NO_INTENTS }
}

// A resize mid-drag moves every boundary, so re-derive them from the new
// geometry rather than dropping against stale positions.
const reduceGeometryChanged = (
  state: DraggingGesture,
  geometries: TableGeometry[],
): GestureTransition => {
  const geometry = geometryAt(geometries, state.tablePos)
  if (!geometry) return unchanged(state)
  const boundaries = boundariesFromGeometry(
    geometry,
    state.projection,
    state.lockMinIndex,
  )
  if (
    boundaries.length === 0 ||
    boundariesEqual(boundaries, state.boundaries)
  ) {
    return unchanged(state)
  }
  return { state: { ...state, boundaries }, intents: NO_INTENTS }
}

const reduceDraggingRelease = (state: DraggingGesture): GestureTransition => {
  const to = resolveDropIndex({
    pointer: state.pointer,
    boundaries: state.boundaries,
    from: state.from,
    lockMinIndex: state.lockMinIndex,
  })
  const { axis, tablePos, from } = state

  // The drop is followed by a click on the handle, which would otherwise
  // re-select the slot the pointer happens to be over.
  const intents: GestureIntent[] = [{ type: "suppressNextClick" }]
  if (to !== from) intents.push({ type: "moveSlot", axis, tablePos, from, to })
  intents.push({ type: "selectSlot", axis, tablePos, index: to })

  return { state: IDLE_GESTURE, intents }
}

export const reduceGesture = (
  state: GestureState,
  event: GestureEvent,
): GestureTransition => {
  switch (event.type) {
    case "press":
      // A fresh press abandons whatever was in flight.
      return {
        state: {
          phase: "pending",
          axis: event.axis,
          tablePos: event.tablePos,
          from: event.index,
          projection: event.projection,
          lockMinIndex: event.lockMinIndex,
          boundaries: collectAxisBoundaries(
            event.rects,
            event.lockMinIndex,
            event.projection,
          ),
          startClientX: event.clientX,
          startClientY: event.clientY,
        },
        intents: NO_INTENTS,
      }

    case "move":
      if (state.phase === "pending") return reducePendingMove(state, event)
      if (state.phase === "dragging") return reduceDraggingMove(state, event)
      return unchanged(state)

    case "geometryChanged":
      if (state.phase !== "dragging") return unchanged(state)
      return reduceGeometryChanged(state, event.geometries)

    case "release":
      if (state.phase === "pending") {
        return {
          state: IDLE_GESTURE,
          intents: [
            {
              type: "selectSlot",
              axis: state.axis,
              tablePos: state.tablePos,
              index: state.from,
            },
          ],
        }
      }
      if (state.phase === "dragging") return reduceDraggingRelease(state)
      return unchanged(state)
  }
}
