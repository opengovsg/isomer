import type { Node as ProseMirrorNode } from "@tiptap/pm/model"
import type { NodeViewProps } from "@tiptap/react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { Box } from "@chakra-ui/react"
import { clampTableColumnWidth } from "@opengovsg/isomer-components"
import { TableMap } from "@tiptap/pm/tables"
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import {
  measureColumnWidths,
  setTableColumnWidths,
  storedColumnWidths,
} from "~/features/editing-experience/utils/columnWidths"
import {
  beginPreviewColumnWidthPaint,
  endPreviewColumnWidthPaint,
  schedulePreviewColumnWidthPaint,
} from "~/features/editing-experience/utils/previewColumnWidths"
import { TABLE_GUTTER_PX } from "~/features/editing-experience/utils/tableEditorChrome"

import { TableCaption } from "./TableCaption"
import { tableScrollFadeLabel, tableScrollFadeMask } from "./tableScrollFade"
import { useTableScrollFade } from "./useTableScrollFade"

const applyColumnWidths = (
  table: HTMLTableElement,
  widths: number[] | null,
) => {
  const existing = table.querySelector(":scope > colgroup")
  if (!widths) {
    existing?.remove()
    table.style.width = ""
    return
  }

  const group =
    existing instanceof HTMLElement
      ? existing
      : document.createElement("colgroup")
  group.replaceChildren(
    ...widths.map((width) => {
      const col = document.createElement("col")
      col.style.width = `${width}px`
      return col
    }),
  )
  if (!existing) table.insertBefore(group, table.firstChild)
  table.style.width = `${widths.reduce((sum, width) => sum + width, 0)}px`
}

const tableIndexAt = (doc: ProseMirrorNode, pos: number): number => {
  let index = 0
  doc.nodesBetween(0, pos, (node) => {
    if (node.type.name !== "table") return true
    index += 1
    return false
  })
  return index
}

const ColumnResizeHandles = ({
  columnCount,
  widths,
  onDrag,
  onCommit,
  onResizeStart,
}: {
  columnCount: number
  widths: number[] | null
  onDrag: (widths: number[] | null) => void
  onCommit: (widths: number[] | null, recordHistory: boolean) => void
  onResizeStart: () => void
}) => {
  const stopDrag = useRef<(() => void) | null>(null)
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  useEffect(() => () => stopDrag.current?.(), [])

  if (columnCount < 1) return null

  const leftOf = (index: number) => {
    if (!widths) return `${((index + 1) / columnCount) * 100}%`
    const edge = widths
      .slice(0, index + 1)
      .reduce((sum, width) => sum + width, 0)
    return `${edge}px`
  }

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
      // Every exit uses this. Move only previews; a successful release is the
      // one document write. Cancel, blur, lost capture, and unmount drop it.
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
        onCommit(next, true)
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
      onResizeStart()
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

  return (
    <Box
      position="absolute"
      inset={0}
      pointerEvents="none"
      contentEditable={false}
    >
      {Array.from({ length: columnCount }, (_, index) => (
        <Box
          key={index}
          role="separator"
          aria-orientation="vertical"
          aria-label={`Resize column ${index + 1}`}
          position="absolute"
          top={0}
          bottom={0}
          w="8px"
          ml="-4px"
          left={leftOf(index)}
          zIndex={3}
          pointerEvents="auto"
          cursor="col-resize"
          onPointerDown={onPointerDown(index)}
          onMouseEnter={() => setHoverIndex(index)}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <Box
            w="2px"
            h="full"
            mx="auto"
            bg="interaction.main.default"
            opacity={hoverIndex === index || activeIndex === index ? 1 : 0}
            pointerEvents="none"
          />
        </Box>
      ))}
    </Box>
  )
}

export const TableNodeView = ({
  node,
  getPos,
  updateAttributes,
  editor,
}: NodeViewProps) => {
  const caption = (node.attrs.caption as string | undefined) ?? ""
  const columnCount = TableMap.get(node).width
  const stored = storedColumnWidths(node, columnCount)
  const [preview, setPreview] = useState<number[] | null>(null)
  const widths = preview ?? stored
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollportRef = useRef<HTMLDivElement>(null)
  const sum = widths?.reduce((total, width) => total + width, 0)
  const fade = useTableScrollFade(
    scrollportRef,
    `${columnCount}:${sum ?? "auto"}`,
  )
  const fadeLabel = tableScrollFadeLabel(fade)
  const fadeMask = tableScrollFadeMask(fade)

  useEffect(() => {
    if (!preview || !stored) return
    if (
      preview.length === stored.length &&
      preview.every((width, index) => width === stored[index])
    ) {
      setPreview(null)
    }
  }, [preview, stored])

  useLayoutEffect(() => {
    const table = rootRef.current?.querySelector("table")
    if (!(table instanceof HTMLTableElement)) return
    applyColumnWidths(table, widths)
  }, [widths, node])

  return (
    <Box
      as={NodeViewWrapper}
      display="flex"
      flexDirection="column"
      w="100%"
      minW={0}
    >
      <Box contentEditable={false}>
        <TableCaption
          caption={caption}
          onCaptionChange={(nextCaption) =>
            updateAttributes({ caption: nextCaption })
          }
        />
      </Box>
      <Box p={`${TABLE_GUTTER_PX}px`} minW={0}>
        <Box
          ref={scrollportRef}
          data-table-scrollport=""
          {...(fadeLabel ? { "data-table-scroll-fade": fadeLabel } : {})}
          w="100%"
          minW={0}
          overflowX="auto"
          style={
            fadeMask
              ? { maskImage: fadeMask, WebkitMaskImage: fadeMask }
              : undefined
          }
        >
          <Box
            ref={rootRef}
            data-column-resize-root=""
            position="relative"
            w={sum ? `${sum}px` : "100%"}
          >
            <NodeViewContent<"table">
              as="table"
              style={sum ? { width: `${sum}px` } : undefined}
            />
            {editor.isEditable && (
              <ColumnResizeHandles
                columnCount={columnCount}
                widths={widths}
                onResizeStart={() => {
                  const pos = getPos()
                  if (typeof pos !== "number") return
                  beginPreviewColumnWidthPaint(
                    tableIndexAt(editor.state.doc, pos),
                  )
                }}
                onDrag={(next) => {
                  setPreview(next)
                  if (next) schedulePreviewColumnWidthPaint(next)
                  else endPreviewColumnWidthPaint("cancel")
                }}
                onCommit={(next, recordHistory) => {
                  endPreviewColumnWidthPaint("commit")
                  setPreview(next)
                  const pos = getPos()
                  if (typeof pos !== "number") return
                  const tr = editor.state.tr
                  setTableColumnWidths(tr, pos, next)
                  if (!recordHistory) tr.setMeta("addToHistory", false)
                  if (tr.docChanged) editor.view.dispatch(tr)
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
