import type { NodeViewProps } from "@tiptap/react"
import { Box } from "@chakra-ui/react"
import { TableMap } from "@tiptap/pm/tables"
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react"
import { useLayoutEffect, useRef } from "react"
import {
  setTableColumnWidths,
  storedColumnWidths,
} from "~/features/editing-experience/utils/columnWidths"
import { TABLE_GUTTER_PX } from "~/features/editing-experience/utils/tableEditorChrome"

import { applyTableColumnWidthsDom } from "./applyTableColumnWidthsDom"
import { ColumnResizeHandles } from "./ColumnResizeHandles"
import { TableCaption } from "./TableCaption"
import { useTableScrollFadeMask } from "./tableScrollFade"

export const TableNodeView = ({
  node,
  getPos,
  updateAttributes,
  editor,
}: NodeViewProps) => {
  const caption = (node.attrs.caption as string | undefined) ?? ""
  const columnCount = TableMap.get(node).width
  const widths = storedColumnWidths(node, columnCount)
  // Widths before the current drag. undefined when no drag is in progress.
  const dragOrigin = useRef<number[] | null | undefined>(undefined)
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollportRef = useRef<HTMLDivElement>(null)
  const sum = widths?.reduce((total, width) => total + width, 0)
  const fadeMask = useTableScrollFadeMask(
    scrollportRef,
    `${columnCount}:${sum ?? "auto"}`,
  )

  useLayoutEffect(() => {
    const table = rootRef.current?.querySelector("table")
    if (!(table instanceof HTMLTableElement)) return
    applyTableColumnWidthsDom(table, widths)
  }, [widths, node])

  const writeColumnWidths = (next: number[] | null, addToHistory: boolean) => {
    const pos = getPos()
    if (typeof pos !== "number") return
    const tr = editor.state.tr
    setTableColumnWidths(tr, pos, next)
    if (!addToHistory) tr.setMeta("addToHistory", false)
    if (tr.docChanged) editor.view.dispatch(tr)
  }

  // Drag frames write to the doc outside history so the page preview follows.
  const dragColumnWidths = (next: number[] | null) => {
    if (dragOrigin.current === undefined) dragOrigin.current = widths
    if (next) {
      writeColumnWidths(next, false)
      return
    }
    writeColumnWidths(dragOrigin.current, false)
    dragOrigin.current = undefined
  }

  // Rewind to the pre-drag widths outside history first, so the one undoable
  // step goes from pre-drag to final rather than from the last drag frame.
  const commitColumnWidths = (next: number[] | null) => {
    if (dragOrigin.current !== undefined) {
      writeColumnWidths(dragOrigin.current, false)
      dragOrigin.current = undefined
    }
    writeColumnWidths(next, true)
  }

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
                onDrag={dragColumnWidths}
                onCommit={commitColumnWidths}
              />
            )}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
