import type { Editor } from "@tiptap/react"
import type { PointerEvent as ReactPointerEvent, RefObject } from "react"
import { Box } from "@chakra-ui/react"
import {
  clampTableColumnWidth,
  validateTableColumnWidths,
} from "@opengovsg/isomer-components"
import { TableMap } from "@tiptap/pm/tables"
import { useEditorState } from "@tiptap/react"
import { useLayoutEffect, useRef } from "react"

import {
  columnBoundaryLefts,
  measureTableColumnWidths,
  TABLE_COLUMN_RESIZE_HIT_PX,
} from "./columnResizeHandles"

const COLGROUP_ATTR = "data-author-column-widths"

interface ColumnLayout {
  widths: number[] | null
  columnCount: number
}

const layoutsEqual = (left: ColumnLayout, right: ColumnLayout): boolean => {
  if (left.columnCount !== right.columnCount) return false
  if (left.widths == null || right.widths == null) {
    return left.widths === right.widths
  }
  return (
    left.widths.length === right.widths.length &&
    left.widths.every((width, index) => width === right.widths?.[index])
  )
}

const resolveTableElement = (
  overlayRoot: HTMLDivElement | null,
  tableRef: RefObject<HTMLTableElement | null>,
): HTMLTableElement | null => {
  const sibling = overlayRoot?.previousElementSibling
  return sibling instanceof HTMLTableElement ? sibling : tableRef.current
}

const applyAuthorColumnWidths = (
  table: HTMLTableElement,
  widths: number[] | null,
) => {
  const existing = table.querySelector(`:scope > colgroup[${COLGROUP_ATTR}]`)
  if (!widths) {
    existing?.remove()
    table.style.width = ""
    table.style.tableLayout = ""
    if (table.parentElement instanceof HTMLElement) {
      table.parentElement.style.width = "100%"
    }
    return
  }

  const total = widths.reduce((sum, width) => sum + width, 0)
  table.style.width = `${total}px`
  table.style.tableLayout = "fixed"
  if (table.parentElement instanceof HTMLElement) {
    table.parentElement.style.width = `${total}px`
  }

  const colgroup = existing ?? document.createElement("colgroup")
  colgroup.setAttribute(COLGROUP_ATTR, "")
  if (!existing) table.prepend(colgroup)

  const cols = colgroup.children
  if (cols.length !== widths.length) {
    colgroup.replaceChildren(
      ...widths.map((width) => {
        const col = document.createElement("col")
        col.style.width = `${width}px`
        return col
      }),
    )
    return
  }

  widths.forEach((width, index) => {
    const col = cols.item(index)
    if (col instanceof HTMLElement) col.style.width = `${width}px`
  })
}

const positionHandles = (
  handles: (HTMLDivElement | null)[],
  widths: number[] | null,
  columnCount: number,
) => {
  if (widths) {
    columnBoundaryLefts(widths).forEach((left, index) => {
      const handle = handles[index]
      if (handle) {
        handle.style.left = `${left - TABLE_COLUMN_RESIZE_HIT_PX / 2}px`
      }
    })
    return
  }

  handles.forEach((handle, index) => {
    if (!handle || columnCount <= 0) return
    const percent = ((index + 1) / columnCount) * 100
    handle.style.left = `calc(${percent}% - ${TABLE_COLUMN_RESIZE_HIT_PX / 2}px)`
  })
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
  const overlayRootRef = useRef<HTMLDivElement>(null)
  const handlesRef = useRef<(HTMLDivElement | null)[]>([])
  const draggingRef = useRef(false)
  const stopDragRef = useRef<(() => void) | null>(null)

  const layout = useEditorState({
    editor,
    selector: ({ editor: current }): ColumnLayout => {
      const tablePos = getPos()
      if (tablePos == null) return { widths: null, columnCount: 0 }
      const node = current.state.doc.nodeAt(tablePos)
      if (!node || node.type.name !== "table") {
        return { widths: null, columnCount: 0 }
      }
      const columnCount = TableMap.get(node).width
      return {
        columnCount,
        widths: validateTableColumnWidths(node.attrs.columnWidths, columnCount),
      }
    },
    equalityFn: (left, right) =>
      !!left && !!right && layoutsEqual(left, right),
  })

  useLayoutEffect(() => {
    if (draggingRef.current) return
    const table = resolveTableElement(overlayRootRef.current, tableRef)
    if (!table) return

    const paint = () => {
      if (draggingRef.current) return
      applyAuthorColumnWidths(table, layout.widths)
      positionHandles(handlesRef.current, layout.widths, layout.columnCount)
    }

    paint()
    const observer = new MutationObserver(paint)
    observer.observe(table, { childList: true })
    return () => observer.disconnect()
  }, [layout, tableRef])

  useLayoutEffect(() => {
    return () => stopDragRef.current?.()
  }, [])

  if (layout.columnCount < 1) return null

  const commitWidths = (columnWidths: number[]) => {
    const tablePos = getPos()
    if (tablePos == null) return
    const current = editor.state.doc.nodeAt(tablePos)
    if (!current) return
    editor.view.dispatch(
      editor.view.state.tr.setNodeMarkup(tablePos, undefined, {
        ...current.attrs,
        columnWidths,
      }),
    )
  }

  const startDrag = (event: ReactPointerEvent, columnIndex: number) => {
    if (!editor.isEditable || stopDragRef.current) return
    if (event.pointerType && event.pointerType !== "mouse") return
    if (event.button !== 0) return

    const table = resolveTableElement(overlayRootRef.current, tableRef)
    if (!table || layout.columnCount < 1) return

    event.preventDefault()
    event.stopPropagation()

    const startWidths =
      layout.widths ?? measureTableColumnWidths(table, layout.columnCount)
    const startX = event.clientX
    let latest = startWidths
    let moved = false
    draggingRef.current = true
    applyAuthorColumnWidths(table, startWidths)
    positionHandles(handlesRef.current, startWidths, startWidths.length)
    handlesRef.current[columnIndex]?.setAttribute("data-resizing", "")

    const win = editor.view.dom.ownerDocument.defaultView ?? window

    const onPointerMove = (moveEvent: PointerEvent) => {
      moved = true
      const next = startWidths.slice()
      next[columnIndex] = clampTableColumnWidth(
        startWidths[columnIndex]! + (moveEvent.clientX - startX),
      )
      latest = next
      applyAuthorColumnWidths(table, next)
      positionHandles(handlesRef.current, next, next.length)
    }

    const endDrag = () => {
      win.removeEventListener("pointermove", onPointerMove)
      win.removeEventListener("pointerup", onPointerUp)
      stopDragRef.current = null
      handlesRef.current[columnIndex]?.removeAttribute("data-resizing")
      draggingRef.current = false
    }

    const onPointerUp = () => {
      const finalWidths = latest
      const changed =
        !layout.widths ||
        finalWidths[columnIndex] !== startWidths[columnIndex]
      endDrag()
      if (moved && changed) commitWidths(finalWidths)
      else positionHandles(handlesRef.current, layout.widths, layout.columnCount)
      if (!moved || !changed) {
        applyAuthorColumnWidths(table, layout.widths)
      }
    }

    win.addEventListener("pointermove", onPointerMove)
    win.addEventListener("pointerup", onPointerUp)
    stopDragRef.current = endDrag
  }

  return (
    <Box
      ref={overlayRootRef}
      contentEditable={false}
      position="absolute"
      inset={0}
      pointerEvents="none"
      zIndex={3}
    >
      {Array.from({ length: layout.columnCount }, (_, index) => (
        <Box
          key={index}
          ref={(element: HTMLDivElement | null) => {
            handlesRef.current[index] = element
          }}
          position="absolute"
          top={0}
          bottom={0}
          w={`${TABLE_COLUMN_RESIZE_HIT_PX}px`}
          cursor="col-resize"
          pointerEvents="auto"
          data-testid="isomer-table-resize-handle"
          data-column-index={String(index)}
          onPointerDown={(event) => startDrag(event, index)}
          sx={{
            "&::after": {
              content: '""',
              position: "absolute",
              top: 0,
              bottom: 0,
              left: "3px",
              width: "2px",
              bg: "interaction.main.default",
              opacity: 0,
            },
            "&:hover::after, &[data-resizing]::after": {
              opacity: 1,
            },
          }}
        />
      ))}
    </Box>
  )
}
