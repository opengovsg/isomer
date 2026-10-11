import type { RefObject } from "react"
import { useEffect, useRef, useState } from "react"
import { TABLE_GUTTER_PX } from "~/features/editing-experience/utils/tableEditorChrome"

import type { TableGeometry } from "./axisMath"
import { getTableBounds } from "./axisMath"
import { viewportPointToContainerPoint } from "./measure"

/** How far into the table the select button stays visible from the top-left corner. */
export const SELECT_TABLE_CORNER_REACH_PX = 40

/**
 * Position of the table whose gutter contains the pointer, or null. Geometry is
 * held in container coordinates and the pointer arrives in viewport ones, so
 * the pointer is converted in through the container's scroll offset once and
 * hit-tested against every table's bounds.
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
  const { x, y } = viewportPointToContainerPoint({
    clientX,
    clientY,
    containerRect,
    scrollTop,
    scrollLeft,
  })

  // A table counts as hovered anywhere in its gutter, including outside cells.
  const match = geometries.find((geometry) => {
    const bounds = getTableBounds(geometry)
    if (!bounds) return false
    return (
      x >= bounds.left - TABLE_GUTTER_PX &&
      x <= bounds.left + bounds.width + TABLE_GUTTER_PX &&
      y >= bounds.top - TABLE_GUTTER_PX &&
      y <= bounds.top + bounds.height + TABLE_GUTTER_PX
    )
  })

  return match?.pos ?? null
}

/**
 * Position of the table whose top-left corner is near the pointer, or null.
 * The box is the gutter outside that corner plus `SELECT_TABLE_CORNER_REACH_PX`
 * into the table.
 */
export const findHoveredTableCornerPos = ({
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
  const { x, y } = viewportPointToContainerPoint({
    clientX,
    clientY,
    containerRect,
    scrollTop,
    scrollLeft,
    })

  const match = geometries.find((geometry) => {
    const bounds = getTableBounds(geometry)
    if (!bounds) return false
    return (
      x >= bounds.left - TABLE_GUTTER_PX &&
      x <= bounds.left + SELECT_TABLE_CORNER_REACH_PX &&
      y >= bounds.top - TABLE_GUTTER_PX &&
      y <= bounds.top + SELECT_TABLE_CORNER_REACH_PX
    )
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
): { tablePos: number | null; cornerTablePos: number | null } => {
  const [hoverTablePos, setHoverTablePos] = useState<number | null>(null)
  const [cornerTablePos, setCornerTablePos] = useState<number | null>(null)
  const lastPointerRef = useRef<{ clientX: number; clientY: number } | null>(
    null,
  )

  useEffect(() => {
    let frame: number | null = null

    const hitTestTables = () => {
      if (isGestureActive()) return
      const last = lastPointerRef.current
      if (!last) return
      const container = containerRef.current
      if (!container) return

      const hit = {
        geometries,
        clientX: last.clientX,
        clientY: last.clientY,
        containerRect: container.getBoundingClientRect(),
        scrollTop: container.scrollTop,
        scrollLeft: container.scrollLeft,
      }
      setHoverTablePos(findHoveredTablePos(hit))
      setCornerTablePos(findHoveredTableCornerPos(hit))
    }

    const scheduleHitTest = (
      clientX: number,
      clientY: number,
      { force = false }: { force?: boolean } = {},
    ) => {
      lastPointerRef.current = { clientX, clientY }
      if (frame !== null) {
        if (!force) return
        cancelAnimationFrame(frame)
        frame = null
      }
      frame = requestAnimationFrame(() => {
        frame = null
        hitTestTables()
      })
    }

    const onMove = (event: MouseEvent) => {
      scheduleHitTest(event.clientX, event.clientY)
    }

    const onScroll = () => {
      const last = lastPointerRef.current
      if (!last) return
      scheduleHitTest(last.clientX, last.clientY, { force: true })
    }

    window.addEventListener("mousemove", onMove)
    window.addEventListener("scroll", onScroll, { capture: true })

    const last = lastPointerRef.current
    if (last) {
      scheduleHitTest(last.clientX, last.clientY, { force: true })
    }

    return () => {
      window.removeEventListener("mousemove", onMove)
      window.removeEventListener("scroll", onScroll, { capture: true })
      if (frame !== null) cancelAnimationFrame(frame)
    }
  }, [geometries, containerRef, isGestureActive])

  return { tablePos: hoverTablePos, cornerTablePos }
}
