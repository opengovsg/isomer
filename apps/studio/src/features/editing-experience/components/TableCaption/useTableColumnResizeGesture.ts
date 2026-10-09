import type { PointerEvent as ReactPointerEvent } from "react"
import { clampTableColumnWidth } from "@opengovsg/isomer-components"
import { useEffect, useRef, useState } from "react"
import { measureColumnWidths } from "~/features/editing-experience/utils/columnWidths"

export const useTableColumnResizeGesture = ({
  columnCount,
  widths,
  onDrag,
  onCommit,
}: {
  columnCount: number
  widths: number[] | null
  onDrag: (widths: number[] | null) => void
  onCommit: (widths: number[] | null) => void
}) => {
  const stopDrag = useRef<(() => void) | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  useEffect(() => () => stopDrag.current?.(), [])

  const onPointerDown =
    (index: number) => (event: ReactPointerEvent<HTMLDivElement>) => {
      if (event.pointerType && event.pointerType !== "mouse") return
      if (event.button !== 0) return
      event.preventDefault()
      event.stopPropagation()

      const root = event.currentTarget.closest("[data-column-resize-root]")
      const table = root?.querySelector("table")
      if (!(table instanceof HTMLTableElement)) return

      const handle = event.currentTarget
      const pointerId = event.pointerId
      const origin = widths ?? measureColumnWidths(table, columnCount)
      const startX = event.clientX
      const startWidth = origin[index] ?? clampTableColumnWidth(0)
      let lastWidth = startWidth
      let finished = false
      let listenTarget: EventTarget = document
      setActiveIndex(index)

      const widthsAt = (clientX: number) => {
        const next = origin.slice()
        next[index] = clampTableColumnWidth(startWidth + clientX - startX)
        return next
      }
      const samePointer = (pointer: PointerEvent) =>
        pointer.pointerId === pointerId
      const detach = () => {
        listenTarget.removeEventListener("pointermove", move)
        listenTarget.removeEventListener("pointerup", up)
        listenTarget.removeEventListener("pointercancel", cancel)
        handle.removeEventListener("lostpointercapture", onLostCapture)
        window.removeEventListener("blur", onBlur)
        stopDrag.current = null
      }
      // Pointermove updates preview state only. Pointerup dispatches once.
      const finishDrag = (mode: "commit" | "cancel", clientX: number) => {
        if (finished) return
        finished = true
        detach()
        if (handle.hasPointerCapture(pointerId)) {
          handle.releasePointerCapture(pointerId)
        }
        setActiveIndex(null)
        if (mode === "cancel") {
          onDrag(null)
          return
        }
        const next = widthsAt(clientX)
        const changed = next.some((width, i) => width !== origin[i])
        if (!changed) {
          onDrag(null)
          return
        }
        onCommit(next)
      }
      const pointerFrom = (event: Event): PointerEvent | null =>
        event instanceof PointerEvent ? event : null
      const move = (event: Event) => {
        const pointer = pointerFrom(event)
        if (!pointer || !samePointer(pointer)) return
        const next = widthsAt(pointer.clientX)
        const width = next[index] ?? startWidth
        if (width === lastWidth) return
        lastWidth = width
        onDrag(next)
      }
      const up = (event: Event) => {
        const pointer = pointerFrom(event)
        if (!pointer || !samePointer(pointer)) return
        finishDrag("commit", pointer.clientX)
      }
      const cancel = (event: Event) => {
        const pointer = pointerFrom(event)
        if (!pointer || !samePointer(pointer)) return
        finishDrag("cancel", pointer.clientX)
      }
      const onLostCapture = (event: Event) => {
        const pointer = pointerFrom(event)
        if (!pointer || !samePointer(pointer)) return
        finishDrag("cancel", pointer.clientX)
      }
      const onBlur = () => {
        finishDrag("cancel", startX)
      }

      stopDrag.current?.()
      stopDrag.current = () => finishDrag("cancel", startX)
      try {
        handle.setPointerCapture(pointerId)
      } catch {
        // Synthetic pointers cannot be captured. Document listeners still
        // receive the bubbled gesture.
      }
      listenTarget = handle.hasPointerCapture(pointerId) ? handle : document
      listenTarget.addEventListener("pointermove", move)
      listenTarget.addEventListener("pointerup", up)
      listenTarget.addEventListener("pointercancel", cancel)
      handle.addEventListener("lostpointercapture", onLostCapture)
      window.addEventListener("blur", onBlur)
    }

  return { activeIndex, hoverIndex, setHoverIndex, onPointerDown }
}
