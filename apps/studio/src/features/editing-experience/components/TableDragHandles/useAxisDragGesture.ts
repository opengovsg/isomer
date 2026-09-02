import type { Editor as TiptapEditor } from "@tiptap/react"
import type { MouseEvent as ReactMouseEvent, RefObject } from "react"
import type { Rect } from "~/features/editing-experience/utils/tableEditorGeometry"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { viewportPointToContainerPoint } from "~/features/editing-experience/utils/tableEditorGeometry"

import type { Axis } from "./axis"
import type { TableGeometry } from "./geometry"
import { AXIS, getAxisLockMinIndex } from "./axis"
import {
  boundariesFromGeometry,
  collectAxisBoundaries,
  resolveDropIndex,
} from "./geometry"
import { selectWholeSlot } from "./selection"

const DRAG_THRESHOLD_PX = 4
export const TABLE_DRAGGING_ATTR = "data-table-drag-handles-dragging"

export interface DragState {
  axis: Axis
  from: number
  tablePos: number
  pointer: number
  boundaries: number[]
  lockMinIndex: number
}

interface PendingGesture {
  axis: Axis
  from: number
  tablePos: number
  startClientX: number
  startClientY: number
  boundaries: number[]
  lockMinIndex: number
}

export interface AxisDragGesture {
  drag: DragState | null
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
 * Press-and-drag on a row or column handle. A press that never crosses the
 * threshold falls back to selecting the slot, so handles stay clickable.
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
  const [drag, setDrag] = useState<DragState | null>(null)
  const dragRef = useRef<DragState | null>(null)
  const pendingRef = useRef<PendingGesture | null>(null)
  const suppressNextClickRef = useRef(false)

  const isGestureActive = useCallback(
    () => !!dragRef.current || !!pendingRef.current,
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
        const lockMinIndex = getAxisLockMinIndex(
          editor.state.doc,
          tablePos,
          axis,
        )
        pendingRef.current = {
          axis,
          from: index,
          tablePos,
          startClientX: event.clientX,
          startClientY: event.clientY,
          boundaries: collectAxisBoundaries(rects, lockMinIndex, axis),
          lockMinIndex,
        }
      },
    [editor],
  )

  // A resize mid-drag moves every boundary, so re-derive them from the new
  // geometry rather than dropping against stale positions.
  useLayoutEffect(() => {
    const current = dragRef.current
    if (!current) return
    const geometry = geometries.find((g) => g.pos === current.tablePos)
    if (!geometry) return
    const boundaries = boundariesFromGeometry(
      geometry,
      current.axis,
      current.lockMinIndex,
    )
    if (boundaries.length === 0) return
    if (
      boundaries.length === current.boundaries.length &&
      boundaries.every((value, index) => value === current.boundaries[index])
    ) {
      return
    }
    const next = { ...current, boundaries }
    dragRef.current = next
    setDrag(next)
  }, [geometries])

  useEffect(() => {
    const container = containerRef.current
    if (!drag) {
      container?.removeAttribute(TABLE_DRAGGING_ATTR)
      return
    }
    container?.setAttribute(TABLE_DRAGGING_ATTR, "")
    return () => container?.removeAttribute(TABLE_DRAGGING_ATTR)
  }, [drag, containerRef])

  const wasDraggingRef = useRef(false)
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    if (drag) {
      wasDraggingRef.current = true
      onDragStateChange?.(true)
      return
    }
    if (!wasDraggingRef.current) return
    wasDraggingRef.current = false
    queueMicrotask(() => {
      if (!editor.isDestroyed) onDragStateChange?.(false)
    })
  }, [drag, editor, onDragStateChange])

  useEffect(() => {
    const pointerAlongAxis = (axis: Axis, event: MouseEvent) => {
      const container = containerRef.current
      if (!container) return null
      return AXIS[axis].pointerOf(
        viewportPointToContainerPoint({
          clientX: event.clientX,
          clientY: event.clientY,
          containerRect: container.getBoundingClientRect(),
          scrollTop: container.scrollTop,
          scrollLeft: container.scrollLeft,
        }),
      )
    }

    const onMouseMove = (event: MouseEvent) => {
      const pending = pendingRef.current
      if (pending && !dragRef.current) {
        const dx = event.clientX - pending.startClientX
        const dy = event.clientY - pending.startClientY
        if (Math.hypot(dx, dy) < DRAG_THRESHOLD_PX) return
        // Header rows and columns stay put; the press still selects them.
        if (pending.from < pending.lockMinIndex) return

        const pointer = pointerAlongAxis(pending.axis, event)
        if (pointer === null) return
        const state: DragState = {
          axis: pending.axis,
          from: pending.from,
          tablePos: pending.tablePos,
          pointer,
          boundaries: pending.boundaries,
          lockMinIndex: pending.lockMinIndex,
        }
        pendingRef.current = null
        dragRef.current = state
        setDrag(state)
        return
      }

      const current = dragRef.current
      if (!current) return
      const pointer = pointerAlongAxis(current.axis, event)
      if (pointer === null) return
      const next = { ...current, pointer }
      dragRef.current = next
      setDrag(next)
    }

    const onMouseUp = () => {
      const pending = pendingRef.current
      pendingRef.current = null
      const current = dragRef.current
      dragRef.current = null
      setDrag(null)

      if (!editor) return

      if (pending) {
        selectWholeSlot(editor, pending.tablePos, pending.axis, pending.from)
        return
      }
      if (!current) return

      suppressNextClickRef.current = true
      const to = resolveDropIndex({
        pointer: current.pointer,
        boundaries: current.boundaries,
        from: current.from,
        lockMinIndex: current.lockMinIndex,
      })
      if (to !== current.from) {
        // The move commands need a position inside the table node.
        AXIS[current.axis].move({
          from: current.from,
          to,
          pos: current.tablePos + 1,
        })(editor.state, editor.view.dispatch)
      }
      selectWholeSlot(editor, current.tablePos, current.axis, to)
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [editor, containerRef])

  return { drag, beginGesture, isGestureActive, consumeClickSuppression }
}
