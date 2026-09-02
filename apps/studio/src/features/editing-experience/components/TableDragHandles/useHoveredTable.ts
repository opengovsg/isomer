import type { RefObject } from "react"
import type { Rect } from "~/features/editing-experience/utils/tableEditorGeometry"
import { useEffect, useState } from "react"
import { isPointerInTableChrome } from "~/features/editing-experience/utils/tableEditorChrome"
import { containerRectToViewportRect } from "~/features/editing-experience/utils/tableEditorGeometry"

import type { TableGeometry } from "./geometry"

/**
 * Position of the table the pointer is over, including the chrome gutter that
 * holds the handles and add pills. Null while a gesture is in flight so the
 * add pills do not flicker mid-drag.
 */
export const useHoveredTable = (
  geometries: TableGeometry[],
  containerRef: RefObject<HTMLElement>,
  isGestureActive: () => boolean,
): number | null => {
  const [hoverTablePos, setHoverTablePos] = useState<number | null>(null)

  useEffect(() => {
    let frame: number | null = null

    const hitTestTables = (clientX: number, clientY: number) => {
      if (isGestureActive()) return
      const container = containerRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()

      const toViewport = (rect: Rect) =>
        containerRectToViewportRect({
          rect,
          containerRect,
          scrollTop: container.scrollTop,
          scrollLeft: container.scrollLeft,
        })

      const match = geometries.find((geometry) => {
        const rowRects = geometry.rowRects.filter((r): r is Rect => !!r)
        const firstRow = rowRects[0]
        const lastRow = rowRects[rowRects.length - 1]
        if (!firstRow || !lastRow) return false

        const first = toViewport(firstRow)
        const last = toViewport(lastRow)
        return isPointerInTableChrome({
          clientX,
          clientY,
          tableLeft: first.left,
          tableTop: first.top,
          tableRight: first.left + firstRow.width,
          tableBottom: last.top + lastRow.height,
        })
      })

      setHoverTablePos(match?.pos ?? null)
    }

    const onMove = (event: MouseEvent) => {
      if (frame !== null) return
      const { clientX, clientY } = event
      frame = requestAnimationFrame(() => {
        frame = null
        hitTestTables(clientX, clientY)
      })
    }

    window.addEventListener("mousemove", onMove)
    return () => {
      window.removeEventListener("mousemove", onMove)
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [geometries, containerRef, isGestureActive])

  return hoverTablePos
}
