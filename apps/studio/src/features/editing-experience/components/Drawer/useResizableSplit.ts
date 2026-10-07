import type {
  HTMLAttributes,
  KeyboardEvent,
  PointerEvent,
  RefObject,
} from "react"
import { useCallback, useEffect, useRef, useState } from "react"

// Neither pane can be dragged narrower than this share of the container, so
// a pane (and the separator next to it) can't be lost off the edge.
const MIN_PANE_PERCENT = 10
const KEYBOARD_STEP_PERCENT = 5

const clampPercent = (percent: number) =>
  Math.min(100 - MIN_PANE_PERCENT, Math.max(MIN_PANE_PERCENT, percent))

interface UseResizableSplitResult {
  // Attach to the element containing both panes and the separator.
  containerRef: RefObject<HTMLDivElement>
  // Width of the first pane, as a percentage of the container.
  firstPanePercent: number
  // While true, the panes should ignore pointer events: an iframe under the
  // pointer would otherwise swallow the drag's pointer events.
  isDragging: boolean
  separatorProps: HTMLAttributes<HTMLElement>
}

/**
 * Splits a container into two side-by-side panes, resized by dragging the
 * separator between them or with the arrow keys while it's focused.
 */
export function useResizableSplit(): UseResizableSplitResult {
  const containerRef = useRef<HTMLDivElement>(null)
  const [firstPanePercent, setFirstPanePercent] = useState(50)
  const [isDragging, setIsDragging] = useState(false)

  useEffect(() => {
    if (!isDragging) return

    const onPointerMove = (event: globalThis.PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect?.width) return
      setFirstPanePercent(
        clampPercent(((event.clientX - rect.left) / rect.width) * 100),
      )
    }
    const stopDragging = () => setIsDragging(false)

    window.addEventListener("pointermove", onPointerMove)
    window.addEventListener("pointerup", stopDragging)
    window.addEventListener("pointercancel", stopDragging)
    return () => {
      window.removeEventListener("pointermove", onPointerMove)
      window.removeEventListener("pointerup", stopDragging)
      window.removeEventListener("pointercancel", stopDragging)
    }
  }, [isDragging])

  const onPointerDown = useCallback((event: PointerEvent) => {
    // Stops the drag from selecting text.
    event.preventDefault()
    setIsDragging(true)
  }, [])

  const onKeyDown = useCallback((event: KeyboardEvent) => {
    const step =
      event.key === "ArrowLeft"
        ? -KEYBOARD_STEP_PERCENT
        : event.key === "ArrowRight"
          ? KEYBOARD_STEP_PERCENT
          : 0
    if (!step) return
    event.preventDefault()
    setFirstPanePercent((percent) => clampPercent(percent + step))
  }, [])

  return {
    containerRef,
    firstPanePercent,
    isDragging,
    separatorProps: {
      role: "separator",
      tabIndex: 0,
      "aria-orientation": "vertical",
      "aria-label": "Resize panes",
      "aria-valuenow": Math.round(firstPanePercent),
      "aria-valuemin": MIN_PANE_PERCENT,
      "aria-valuemax": 100 - MIN_PANE_PERCENT,
      onPointerDown,
      onKeyDown,
    },
  }
}
