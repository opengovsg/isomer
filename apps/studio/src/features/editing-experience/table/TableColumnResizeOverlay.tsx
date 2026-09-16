import type { Editor } from "@tiptap/react"
import type { RefObject } from "react"
import { useLayoutEffect, useRef } from "react"

import { MIN_COLUMN_WIDTH_PX, redistributeOnResize } from "./tableColumnWidths"
import {
  applyColumnWidths,
  beginTableColumnResizeDrag,
  endTableColumnResizeDrag,
  resolveTableElement,
  useTableLayoutSync,
} from "./tableLayoutController"

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
  tableRef: RefObject<HTMLTableElement | null>
  editor: Editor
  getPos: () => number | undefined
}

export const TableColumnResizeOverlay = ({
  tableRef,
  editor,
  getPos,
}: TableColumnResizeOverlayProps) => {
  const stopDragRef = useRef<(() => void) | null>(null)
  const pendingCommitFrameRef = useRef<number | null>(null)
  const handlesRef = useRef<(HTMLDivElement | null)[]>([])
  const overlayRootRef = useRef<HTMLDivElement>(null)

  const liveWidths = useTableLayoutSync({
    editor,
    getPos,
    tableRef,
    overlayRootRef,
  })

  useLayoutEffect(() => {
    applyHandlePositions(handlesRef.current, liveWidths)
  }, [liveWidths])

  useLayoutEffect(() => {
    return () => {
      stopDragRef.current?.()
    }
  }, [])

  if (liveWidths.length < 2) {
    return null
  }

  const commitWidths = (
    nextWidths: number[] | null,
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

    const table = resolveTableElement(overlayRootRef.current, tableRef)
    if (!table) {
      return
    }

    const tableWidthPx = table.getBoundingClientRect().width
    if (tableWidthPx <= 0) {
      return
    }

    event.preventDefault()
    beginTableColumnResizeDrag(editor)

    const tablePosAtDragStart = getPos()
    const preDragColwidths =
      tablePosAtDragStart == null
        ? null
        : ((editor.state.doc.nodeAt(tablePosAtDragStart)?.attrs.colwidths as
            | number[]
            | null
            | undefined) ?? null)
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
      win.removeEventListener("pointercancel", onPointerCancel)
      win.removeEventListener("lostpointercapture", onLostPointerCapture)
      stopDragRef.current = null
      cancelPendingCommit()
      endTableColumnResizeDrag(editor)
    }

    let dragFinished = false

    const finishDrag = (afterEnd: () => void) => {
      if (dragFinished) {
        return
      }
      dragFinished = true
      endDrag()
      afterEnd()
    }

    const preDragResolvedWidths = preDragColwidths ?? startWidths

    const revertToPreDragWidths = () => {
      paintWidths(preDragResolvedWidths)
      commitWidths(preDragColwidths, { addToHistory: false })
    }

    const onPointerUp = (upEvent: PointerEvent) => {
      const finalWidths = computeWidths(upEvent)
      finishDrag(() => {
        // Mid-drag commits leave preview widths in the doc without history. Reset to
        // the pre-drag attrs first so the release commit is one undo step.
        commitWidths(preDragColwidths, { addToHistory: false })
        if (
          !finalWidths.every(
            (width, index) => width === (preDragResolvedWidths[index] ?? 0),
          )
        ) {
          commitWidths(finalWidths)
        }
      })
    }

    const onPointerCancel = () => {
      finishDrag(revertToPreDragWidths)
    }

    const onLostPointerCapture = () => {
      finishDrag(revertToPreDragWidths)
    }

    win.addEventListener("pointermove", onPointerMove)
    win.addEventListener("pointerup", onPointerUp)
    win.addEventListener("pointercancel", onPointerCancel)
    win.addEventListener("lostpointercapture", onLostPointerCapture)
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
