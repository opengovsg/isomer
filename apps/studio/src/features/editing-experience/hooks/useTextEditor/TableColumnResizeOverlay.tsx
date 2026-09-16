import type { Editor } from "@tiptap/react"
import type { RefObject } from "react"
import { useEditorState } from "@tiptap/react"
import { useLayoutEffect, useRef } from "react"

import { applyColumnWidths } from "./applyTableColumnWidths"
import {
  getColumnCount,
  MIN_COLUMN_WIDTH_PX,
  redistributeOnResize,
  resolveColumnWidths,
} from "./tableColumnWidths"

let columnResizeDragCount = 0

export const isTableColumnResizeDragging = (): boolean =>
  columnResizeDragCount > 0

const widthsEqual = (left: number[], right: number[] | null): boolean =>
  right != null &&
  left.length === right.length &&
  left.every((width, index) => width === right[index])

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
  const overlayRootRef = useRef<HTMLDivElement>(null)

  // Subscribe to the editor, not the node-view props: after a column is added,
  // TipTap may skip updateProps, so `widths` would stay stale and the extra
  // column would collapse under table-layout:fixed.
  const liveWidths = useEditorState({
    editor,
    selector: ({ editor: current }) => {
      const tablePos = getPos()
      if (tablePos == null) {
        return widths
      }
      const node = current.state.doc.nodeAt(tablePos)
      if (!node || node.type.name !== "table") {
        return widths
      }
      return resolveColumnWidths(node.attrs.colwidths, getColumnCount(node))
    },
    equalityFn: widthsEqual,
  })

  const resolveTable = (): HTMLTableElement | null => {
    const sibling = overlayRootRef.current?.previousElementSibling
    return sibling instanceof HTMLTableElement ? sibling : tableRef.current
  }

  useLayoutEffect(() => {
    if (isTableColumnResizeDragging()) {
      return
    }
    const sibling = overlayRootRef.current?.previousElementSibling
    const table =
      sibling instanceof HTMLTableElement ? sibling : tableRef.current
    if (table) {
      applyColumnWidths(table, liveWidths)
    }
    applyHandlePositions(handlesRef.current, liveWidths)

    if (!table) {
      return
    }
    const observer = new MutationObserver(() => {
      if (isTableColumnResizeDragging()) {
        return
      }
      applyColumnWidths(table, liveWidths)
    })
    observer.observe(table, { childList: true })
    return () => observer.disconnect()
  }, [liveWidths, tableRef])

  useLayoutEffect(() => {
    return () => {
      stopDragRef.current?.()
    }
  }, [])

  if (liveWidths.length < 2) {
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

    const table = resolveTable()
    if (!table) {
      return
    }

    const tableWidthPx = table.getBoundingClientRect().width
    if (tableWidthPx <= 0) {
      return
    }

    event.preventDefault()
    columnResizeDragCount += 1

    const startWidths = liveWidths
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
      ref={overlayRootRef}
      contentEditable={false}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      {liveWidths.slice(0, -1).map((_, index) => (
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
