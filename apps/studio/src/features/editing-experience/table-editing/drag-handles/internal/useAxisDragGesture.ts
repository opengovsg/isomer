import type { Editor as TiptapEditor } from "@tiptap/react"
import type { MouseEvent as ReactMouseEvent, RefObject } from "react"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import {
  getAxisLockMinIndex,
  getTableAt,
  normalizeHeaderTypesAfterMove,
  shouldNormalizeHeaderAxis,
} from "~/features/editing-experience/table-editing/axis"
import { toMappedTable } from "~/features/editing-experience/table-editing/axis/mappedTable"

import type { Axis } from "../../axis/types"
import type { Rect, TableGeometry } from "./axisMath"
import type {
  DraggingGesture,
  GestureEvent,
  GestureIntent,
  GestureState,
} from "./dragMachine"
import { AXIS_TABLE_OPS } from "./axisTableOps"
import { AXIS_VIEW } from "./axisView"
import { IDLE_GESTURE, reduceGesture } from "./dragMachine"
import { viewportPointToContainerPoint } from "./measure"
import { selectWholeSlot } from "./selection"

export const TABLE_DRAGGING_ATTR = "data-table-drag-handles-dragging"

export interface AxisDragGesture {
  /** Active drag gesture, or null. */
  drag: DraggingGesture | null
  beginGesture: (
    axis: Axis,
    tablePos: number,
    index: number,
    rects: (Rect | null)[],
  ) => (event: ReactMouseEvent) => void
  isGestureActive: () => boolean
  /** True when the click after a drop should be ignored. */
  consumeClickSuppression: () => boolean
}

/** Wire pointer events to dragMachine and apply returned intents to the editor. */
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
  // stateRef holds machine state so window listeners do not resubscribe on every transition.
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
      if (intent.type === "moveSlot") {
        const tableBefore = getTableAt(editor.state.doc, intent.tablePos)
        const normalize =
          !!tableBefore && shouldNormalizeHeaderAxis(tableBefore, intent.axis)
        const move = AXIS_TABLE_OPS[intent.axis].move({
          from: intent.from,
          to: intent.to,
          pos: intent.tablePos + 1,
        })
        const { state, schema } = editor
        let transaction = state.tr
        const moved = move(state, (tr) => {
          transaction = tr
          return true
        })
        if (!moved) return
        if (normalize) {
          transaction = normalizeHeaderTypesAfterMove(
            transaction,
            intent.tablePos,
            intent.axis,
            schema,
          )
        }
        editor.view.dispatch(transaction)
        return
      }
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
        const table = getTableAt(editor.state.doc, tablePos)
        const lockMinIndex = table
          ? getAxisLockMinIndex(toMappedTable(table), axis)
          : 0
        dispatch({
          type: "press",
          axis,
          tablePos,
          index,
          rects,
          projection: AXIS_VIEW[axis],
          lockMinIndex,
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
      // Skip layout reads when idle. This handler runs on every mousemove.
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
