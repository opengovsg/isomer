import type { RefObject } from "react"
import { useEffect, useState } from "react"
import { TABLE_GUTTER_PX } from "~/features/editing-experience/utils/tableEditorChrome"

import type { Rect, TableGeometry } from "./axisMath"
import { containerRectToViewportRect } from "./measure"

interface ViewportBox {
  left: number
  top: number
  right: number
  bottom: number
}

/** A table counts as hovered anywhere within its gutter, not just over cells. */
const isPointerInGutter = (
  clientX: number,
  clientY: number,
  box: ViewportBox,
): boolean =>
  clientX >= box.left - TABLE_GUTTER_PX &&
  clientX <= box.right + TABLE_GUTTER_PX &&
  clientY >= box.top - TABLE_GUTTER_PX &&
  clientY <= box.bottom + TABLE_GUTTER_PX

/**
 * Position of the table whose gutter contains the pointer, or null. Geometry is
 * held in container coordinates and the pointer arrives in viewport ones, so
 * each candidate is converted back out through the container's scroll offset.
 */
export const findHoveredTablePos = ({
  geometries,
  clientX,
  clientY,
  containerRect,
  scrollTop,
  scrollLeft,
}: {
  geometries: TableGeometry[]
  clientX: number
  clientY: number
  containerRect: Pick<DOMRect, "top" | "left">
  scrollTop: number
  scrollLeft: number
}): number | null => {
  const match = geometries.find((geometry) => {
    const rowRects = geometry.rowRects.filter((r): r is Rect => !!r)
    const firstRow = rowRects[0]
    const lastRow = rowRects[rowRects.length - 1]
    if (!firstRow || !lastRow) return false

    const toViewport = (rect: Rect) =>
      containerRectToViewportRect({
        rect,
        containerRect,
        scrollTop,
        scrollLeft,
      })
    const first = toViewport(firstRow)
    const last = toViewport(lastRow)

    return isPointerInGutter(clientX, clientY, {
      left: first.left,
      top: first.top,
      right: first.left + firstRow.width,
      bottom: last.top + lastRow.height,
    })
  })

  return match?.pos ?? null
}

/**
 * Position of the table the pointer is over, including the gutter that holds
 * the handles and add pills. Null while a gesture is in flight so the add pills
 * do not flicker mid-drag.
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

      setHoverTablePos(
        findHoveredTablePos({
          geometries,
          clientX,
          clientY,
          containerRect: container.getBoundingClientRect(),
          scrollTop: container.scrollTop,
          scrollLeft: container.scrollLeft,
        }),
      )
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
