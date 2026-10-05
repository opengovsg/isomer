import type { NodeViewProps } from "@tiptap/react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { Box } from "@chakra-ui/react"
import { clampTableColumnWidth } from "@opengovsg/isomer-components"
import { TableMap } from "@tiptap/pm/tables"
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react"
import { useEffect, useLayoutEffect, useRef, useState } from "react"
import {
  measureColumnWidths,
  storedColumnWidths,
} from "~/features/editing-experience/utils/columnWidths"
import { TABLE_GUTTER_PX } from "~/features/editing-experience/utils/tableEditorChrome"

import { TableCaption } from "./TableCaption"

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

const ColumnResizeHandles = ({
  columnCount,
  widths,
  onDrag,
  onCommit,
}: {
  columnCount: number
  widths: number[] | null
  onDrag: (widths: number[] | null) => void
  onCommit: (widths: number[]) => void
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

      const origin = widths ?? measureColumnWidths(table, columnCount)
      const startX = event.clientX
      const startWidth = origin[index] ?? clampTableColumnWidth(0)
      setActiveIndex(index)

      const move = (pointer: PointerEvent) => {
        const next = origin.slice()
        next[index] = clampTableColumnWidth(
          startWidth + pointer.clientX - startX,
        )
        onDrag(next)
      }
      const up = (pointer: PointerEvent) => {
        stop()
        setActiveIndex(null)
        const next = origin.slice()
        next[index] = clampTableColumnWidth(
          startWidth + pointer.clientX - startX,
        )
        if (next.some((width, i) => width !== origin[i])) onCommit(next)
        else onDrag(null)
      }
      const stop = () => {
        document.removeEventListener("pointermove", move)
        document.removeEventListener("pointerup", up)
        stopDrag.current = null
      }
      stopDrag.current?.()
      stopDrag.current = stop
      document.addEventListener("pointermove", move)
      document.addEventListener("pointerup", up)
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
  updateAttributes,
  editor,
}: NodeViewProps) => {
  const caption = (node.attrs.caption as string | undefined) ?? ""
  const columnCount = TableMap.get(node).width
  const stored = storedColumnWidths(node, columnCount)
  const [preview, setPreview] = useState<number[] | null>(null)
  const widths = preview ?? stored
  const rootRef = useRef<HTMLDivElement>(null)
  const sum = widths?.reduce((total, width) => total + width, 0)

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
    <Box as={NodeViewWrapper} display="flex" flexDirection="column">
      <Box contentEditable={false}>
        <TableCaption
          caption={caption}
          onCaptionChange={(nextCaption) =>
            updateAttributes({ caption: nextCaption })
          }
        />
      </Box>
      <Box p={`${TABLE_GUTTER_PX}px`}>
        <Box data-table-scrollport="" w="100%" overflowX="auto">
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
                onDrag={setPreview}
                onCommit={(next) => {
                  setPreview(next)
                  updateAttributes({ columnWidths: next })
                }}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
