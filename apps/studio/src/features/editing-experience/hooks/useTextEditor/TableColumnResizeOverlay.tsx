import type { Editor } from "@tiptap/react"
import type { RefObject } from "react"
import { useLayoutEffect, useRef } from "react"

import { MIN_COLUMN_WIDTH_PX, redistributeOnResize } from "./tableColumnWidths"

let columnResizeDragCount = 0

export const isTableColumnResizeDragging = (): boolean =>
  columnResizeDragCount > 0

const applyColumnWidths = (table: HTMLTableElement, columnWidths: number[]) => {
  table.style.width = "100%"
  table.style.tableLayout = "fixed"

  let colgroup = table.querySelector("colgroup")
  if (!colgroup) {
    colgroup = document.createElement("colgroup")
    table.prepend(colgroup)
  }

  const cols = colgroup.children
  if (cols.length !== columnWidths.length) {
    colgroup.replaceChildren(
      ...columnWidths.map((width) => {
        const col = document.createElement("col")
        col.style.width = `${width}%`
        return col
      }),
    )
    return
  }

  columnWidths.forEach((width, index) => {
    const col = cols.item(index)
    if (col instanceof HTMLElement) {
      col.style.width = `${width}%`
    }
  })
}

const applyHandlePositions = (
  handles: (HTMLDivElement | null)[],
  widths: number[],
) => {
  let cumulative = 0
  for (let index = 0; index < widths.length - 1; index++) {
    cumulative += widths[index] ?? 0
    const handle = handles[index]
    if (handle) {
      handle.style.left = `calc(${cumulative}% - 4px)`
    }
  }
}

interface TableColumnResizeOverlayProps {
  widths: number[]
  tableRef: RefObject<HTMLTableElement | null>
  editor: Editor
  getPos: () => number | undefined
}

export const TableColumnResizeOverlay = ({
  widths,
  tableRef,
  editor,
  getPos,
}: TableColumnResizeOverlayProps) => {
  const stopDragRef = useRef<(() => void) | null>(null)
  const pendingCommitFrameRef = useRef<number | null>(null)
  const handlesRef = useRef<(HTMLDivElement | null)[]>([])

  useLayoutEffect(() => {
    if (isTableColumnResizeDragging()) {
      return
    }
    const table = tableRef.current
    if (table) {
      applyColumnWidths(table, widths)
    }
    applyHandlePositions(handlesRef.current, widths)
  }, [tableRef, widths])

  useLayoutEffect(() => {
    return () => {
      stopDragRef.current?.()
    }
  }, [])

  if (widths.length < 2) {
    return null
  }

  const commitWidths = (
    nextWidths: number[],
    options: { addToHistory?: boolean } = {},
  ) => {
    const tablePos = getPos()
    if (tablePos == null) {
      return
    }
    const current = editor.state.doc.nodeAt(tablePos)
    if (!current) {
      return
    }
    const tr = editor.view.state.tr.setNodeMarkup(tablePos, null, {
      ...current.attrs,
      colwidths: nextWidths,
    })
    if (options.addToHistory === false) {
      tr.setMeta("addToHistory", false)
    }
    editor.view.dispatch(tr)
  }

  const startDrag = (event: PointerEvent, columnIndex: number) => {
    if (!editor.isEditable || stopDragRef.current) {
      return
    }

    const table = tableRef.current
    if (!table) {
      return
    }

    const tableWidthPx = table.getBoundingClientRect().width
    if (tableWidthPx <= 0) {
      return
    }

    event.preventDefault()
    columnResizeDragCount += 1

    const startWidths = widths
    const minPercent = (MIN_COLUMN_WIDTH_PX / tableWidthPx) * 100
    const startX = event.clientX
    const win = editor.view.dom.ownerDocument.defaultView ?? window

    const computeWidths = (moveEvent: PointerEvent) =>
      redistributeOnResize({
        widths: startWidths,
        columnIndex,
        deltaPercent: ((moveEvent.clientX - startX) / tableWidthPx) * 100,
        minPercent,
      })

    const paintWidths = (nextWidths: number[]) => {
      applyColumnWidths(table, nextWidths)
      applyHandlePositions(handlesRef.current, nextWidths)
    }

    const cancelPendingCommit = () => {
      if (pendingCommitFrameRef.current != null) {
        win.cancelAnimationFrame(pendingCommitFrameRef.current)
        pendingCommitFrameRef.current = null
      }
    }

    const onPointerMove = (moveEvent: PointerEvent) => {
      const nextWidths = computeWidths(moveEvent)
      paintWidths(nextWidths)

      cancelPendingCommit()
      pendingCommitFrameRef.current = win.requestAnimationFrame(() => {
        pendingCommitFrameRef.current = null
        commitWidths(nextWidths, { addToHistory: false })
      })
    }

    const endDrag = () => {
      win.removeEventListener("pointermove", onPointerMove)
      win.removeEventListener("pointerup", onPointerUp)
      stopDragRef.current = null
      cancelPendingCommit()
      columnResizeDragCount = Math.max(0, columnResizeDragCount - 1)
    }

    const onPointerUp = (upEvent: PointerEvent) => {
      endDrag()
      commitWidths(computeWidths(upEvent))
    }

    win.addEventListener("pointermove", onPointerMove)
    win.addEventListener("pointerup", onPointerUp)
    stopDragRef.current = endDrag
  }

  return (
    <div
      contentEditable={false}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {widths.slice(0, -1).map((_, index) => (
        <div
          key={index}
          ref={(element) => {
            handlesRef.current[index] = element
          }}
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            width: "8px",
            cursor: "col-resize",
            pointerEvents: "auto",
          }}
          data-testid="isomer-table-resize-handle"
          data-column-index={String(index)}
          onPointerDown={(event) => startDrag(event.nativeEvent, index)}
        />
      ))}
    </div>
  )
}
