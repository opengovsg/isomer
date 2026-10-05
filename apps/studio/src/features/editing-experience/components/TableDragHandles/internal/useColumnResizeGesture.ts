import type { Editor as TiptapEditor } from "@tiptap/react"
import type { MouseEvent as ReactMouseEvent, RefObject } from "react"
import {
  clampTableColumnWidth,
  validateTableColumnWidths,
} from "@opengovsg/isomer-components"
import { TableMap } from "@tiptap/pm/tables"
import { useCallback, useEffect, useRef, useState } from "react"

import type { TableGeometry } from "./axisMath"
import type { ColumnBoundaryTarget } from "./columnResize"
import {
  getColumnBoundaryTargets,
  TABLE_COLUMN_RESIZE_HIT_PX,
  TABLE_COLUMN_RESIZE_LINE_PX,
} from "./columnResize"
import { getTableAt } from "./axisTableOps"
import { getTableElement } from "./measure"

export { TABLE_COLUMN_RESIZE_HIT_PX, TABLE_COLUMN_RESIZE_LINE_PX }

export interface ColumnResizeLine {
  left: number
  top: number
  height: number
}

interface ActiveDrag {
  tablePos: number
  columnIndex: number
  startX: number
  startLineLeft: number
  startWidths: number[]
  currentWidths: number[]
  line: ColumnResizeLine
}

const snapshotColumnWidths = (
  editor: TiptapEditor,
  tablePos: number,
  geometry: TableGeometry,
): number[] => {
  const table = getTableAt(editor.state.doc, tablePos)
  if (!table) return []
  const map = TableMap.get(table)
  const stored = validateTableColumnWidths(
    table.attrs.columnWidths,
    map.width,
  )
  if (stored) return stored
  return geometry.colRects.map((rect) =>
    clampTableColumnWidth(Math.round(rect?.width ?? 160)),
  )
}

const applyLiveColumnWidths = (
  editor: TiptapEditor,
  tablePos: number,
  widths: number[],
) => {
  const tableElement = getTableElement(editor, tablePos)
  if (!tableElement) return
  const total = widths.reduce((sum, width) => sum + width, 0)
  tableElement.style.width = `${total}px`
  tableElement.classList.add("isomer-table--author-sized")

  let colgroup = tableElement.querySelector("colgroup")
  if (!colgroup) {
    colgroup = document.createElement("colgroup")
    tableElement.insertBefore(colgroup, tableElement.firstChild)
  }
  colgroup.replaceChildren(
    ...widths.map((width) => {
      const col = document.createElement("col")
      col.style.width = `${width}px`
      return col
    }),
  )
}

const lineForColumn = (
  geometry: TableGeometry,
  columnIndex: number,
  widths: number[],
  startWidths: number[],
  startLineLeft: number,
): ColumnResizeLine | null => {
  const targets = getColumnBoundaryTargets(geometry)
  const base = targets[columnIndex]
  if (!base) return null
  const delta = widths[columnIndex]! - startWidths[columnIndex]!
  return {
    left: startLineLeft + delta,
    top: base.top,
    height: base.height,
  }
}

export const useColumnResizeGesture = ({
  editor,
  geometries,
  disabled,
}: {
  editor: TiptapEditor | null
  containerRef: RefObject<HTMLElement>
  geometries: TableGeometry[]
  disabled: boolean
}) => {
  const [hoverLine, setHoverLine] = useState<ColumnResizeLine | null>(null)
  const [dragLine, setDragLine] = useState<ColumnResizeLine | null>(null)
  const dragRef = useRef<ActiveDrag | null>(null)

  const targets = geometries.flatMap(getColumnBoundaryTargets)

  const onGripMouseEnter = useCallback(
    (target: ColumnBoundaryTarget) => () => {
      if (disabled || dragRef.current) return
      setHoverLine({
        left: target.lineLeft,
        top: target.top,
        height: target.height,
      })
    },
    [disabled],
  )

  const onGripMouseLeave = useCallback(() => {
    if (!dragRef.current) setHoverLine(null)
  }, [])

  const onGripMouseDown = useCallback(
    (target: ColumnBoundaryTarget) => (event: ReactMouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      if (!editor || disabled) return

      const geometry = geometries.find((entry) => entry.pos === target.tablePos)
      if (!geometry) return

      const startWidths = snapshotColumnWidths(
        editor,
        target.tablePos,
        geometry,
      )
      dragRef.current = {
        tablePos: target.tablePos,
        columnIndex: target.columnIndex,
        startX: event.clientX,
        startLineLeft: target.lineLeft,
        startWidths,
        currentWidths: startWidths,
        line: {
          left: target.lineLeft,
          top: target.top,
          height: target.height,
        },
      }
      setHoverLine(null)
      setDragLine(dragRef.current.line)
      applyLiveColumnWidths(editor, target.tablePos, startWidths)
    },
    [disabled, editor, geometries],
  )

  useEffect(() => {
    if (!editor) return

    const onMouseMove = (event: MouseEvent) => {
      const drag = dragRef.current
      if (!drag) return
      const geometry = geometries.find((entry) => entry.pos === drag.tablePos)
      if (!geometry) return

      const delta = event.clientX - drag.startX
      const nextWidths = [...drag.startWidths]
      nextWidths[drag.columnIndex] = clampTableColumnWidth(
        drag.startWidths[drag.columnIndex]! + delta,
      )
      drag.currentWidths = nextWidths
      applyLiveColumnWidths(editor, drag.tablePos, nextWidths)
      const nextLine = lineForColumn(
        geometry,
        drag.columnIndex,
        nextWidths,
        drag.startWidths,
        drag.startLineLeft,
      )
      if (nextLine) {
        drag.line = nextLine
        setDragLine(nextLine)
      }
    }

    const onMouseUp = () => {
      const drag = dragRef.current
      if (!drag || !editor) return
      editor
        .chain()
        .setTableColumnWidthsAt(drag.tablePos, drag.currentWidths)
        .run()
      dragRef.current = null
      setDragLine(null)
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", onMouseUp)
    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", onMouseUp)
    }
  }, [editor, geometries])

  return {
    targets,
    hoverLine,
    dragLine,
    onGripMouseDown,
    onGripMouseEnter,
    onGripMouseLeave,
  }
}
