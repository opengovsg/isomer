import type { Editor as TiptapEditor } from "@tiptap/react"
import type { MouseEvent as ReactMouseEvent, RefObject } from "react"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"

import type { Rect, TableGeometry } from "./axisMath"
import type { Axis } from "./axisView"
import type {
  DraggingGesture,
  GestureEvent,
  GestureIntent,
  GestureState,
} from "./dragMachine"
import { AXIS_TABLE_OPS, getAxisLockMinIndex } from "./axisTableOps"
import { AXIS_VIEW } from "./axisView"
import { IDLE_GESTURE, reduceGesture } from "./dragMachine"
import { viewportPointToContainerPoint } from "./measure"
import { selectWholeSlot } from "./selection"

export const TABLE_DRAGGING_ATTR = "data-table-drag-handles-dragging"

export interface AxisDragGesture {
  /** The gesture in flight, once it has become a drag. */
  drag: DraggingGesture | null
  beginGesture: (
    axis: Axis,
    tablePos: number,
    index: number,
    rects: (Rect | null)[],
  ) => (event: ReactMouseEvent) => void
  isGestureActive: () => boolean
  /** True when the click that follows a drop should be swallowed. */
  consumeClickSuppression: () => boolean
}

/**
 * Feeds pointer events to `dragMachine`, publishes the drag state for rendering,
 * and runs the intents the machine returns.
 */
export const useAxisDragGesture = ({
  editor,
  containerRef,
  geometries,
  onDragStateChange,
}: {
  editor: TiptapEditor | null
  containerRef: RefObject<HTMLElement>
  geometries: TableGeometry[]
  onDragStateChange?: (isDragging: boolean) => void
}): AxisDragGesture => {
  const [drag, setDrag] = useState<DraggingGesture | null>(null)
  // The window listeners must read the current state without re-subscribing,
  // so the machine's state lives in a ref and `drag` is derived output.
  const stateRef = useRef<GestureState>(IDLE_GESTURE)
  const suppressNextClickRef = useRef(false)

  const runIntent = useCallback(
    (intent: GestureIntent) => {
      if (intent.type === "suppressNextClick") {
        suppressNextClickRef.current = true
        return
      }
      if (!editor) return
      if (intent.type === "selectSlot") {
        selectWholeSlot(editor, intent.tablePos, intent.axis, intent.index)
        return
      }
      // The move commands need a position inside the table node.
      AXIS_TABLE_OPS[intent.axis].move({
        from: intent.from,
        to: intent.to,
        pos: intent.tablePos + 1,
      })(editor.state, editor.view.dispatch)
    },
    [editor],
  )

  const dispatch = useCallback(
    (event: GestureEvent) => {
      const { state, intents } = reduceGesture(stateRef.current, event)
      if (state !== stateRef.current) {
        stateRef.current = state
        setDrag(state.phase === "dragging" ? state : null)
      }
      intents.forEach(runIntent)
    },
    [runIntent],
  )

  const isGestureActive = useCallback(
    () => stateRef.current.phase !== "idle",
    [],
  )

  const consumeClickSuppression = useCallback(() => {
    if (!suppressNextClickRef.current) return false
    suppressNextClickRef.current = false
    return true
  }, [])

  const beginGesture = useCallback(
    (axis: Axis, tablePos: number, index: number, rects: (Rect | null)[]) =>
      (event: ReactMouseEvent) => {
        event.preventDefault()
        if (!editor) return
        dispatch({
          type: "press",
          axis,
          tablePos,
          index,
          rects,
          projection: AXIS_VIEW[axis],
          lockMinIndex: getAxisLockMinIndex(editor.state.doc, tablePos, axis),
          clientX: event.clientX,
          clientY: event.clientY,
        })
      },
    [editor, dispatch],
  )

  useLayoutEffect(() => {
    dispatch({ type: "geometryChanged", geometries })
  }, [dispatch, geometries])

  useEffect(() => {
    const container = containerRef.current
    if (!drag) {
      container?.removeAttribute(TABLE_DRAGGING_ATTR)
      return
    }
    container?.setAttribute(TABLE_DRAGGING_ATTR, "")
    return () => container?.removeAttribute(TABLE_DRAGGING_ATTR)
  }, [drag, containerRef])

  useEffect(() => {
    onDragStateChange?.(!!drag)
  }, [drag, onDragStateChange])

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      // Skip the layout read when nothing is in flight. The machine would
      // ignore the event anyway, and this fires on every mouse move.
      if (!isGestureActive()) return
      const container = containerRef.current
      dispatch({
        type: "move",
        clientX: event.clientX,
        clientY: event.clientY,
        containerPoint: container
          ? viewportPointToContainerPoint({
              clientX: event.clientX,
              clientY: event.clientY,
              containerRect: container.getBoundingClientRect(),
              scrollTop: container.scrollTop,
              scrollLeft: container.scrollLeft,
            })
          : null,
      })
    }

    const onMouseUp = () => dispatch({ type: "release" })

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [containerRef, dispatch, isGestureActive])

  return { drag, beginGesture, isGestureActive, consumeClickSuppression }
}
