import type { NodeViewProps } from "@tiptap/react"
import { Box } from "@chakra-ui/react"
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react"
import { useRef } from "react"
import { TABLE_GUTTER_PX } from "~/features/editing-experience/utils/tableEditorChrome"

import { TableCaption } from "./TableCaption"
import { TableColumnResizeOverlay } from "./TableColumnResizeOverlay"

export const TableNodeView = ({
  node,
  updateAttributes,
  editor,
  getPos,
}: NodeViewProps) => {
  const caption = (node.attrs.caption as string | undefined) ?? ""
  const tableRef = useRef<HTMLTableElement | null>(null)

  return (
    <Box as={NodeViewWrapper} display="flex" flexDirection="column" w="100%">
      <Box contentEditable={false}>
        <TableCaption
          caption={caption}
          onCaptionChange={(nextCaption) =>
            updateAttributes({ caption: nextCaption })
          }
        />
      </Box>
      <Box display="flex" w="100%" alignItems="stretch">
        {/* Left lane for row handles. Outside the scroller, so cells cannot slide under them. */}
        <Box flex={`0 0 ${TABLE_GUTTER_PX}px`} aria-hidden />
        <Box data-table-h-scroll="" overflowX="auto" flex="1 1 auto" minW={0}>
          <Box pt={`${TABLE_GUTTER_PX}px`} pb={`${TABLE_GUTTER_PX}px`}>
            <Box
              ref={(element) => {
                tableRef.current = element?.querySelector("table") ?? null
              }}
              position="relative"
              w="100%"
            >
              {/*
                TipTap appends a tbody into this table. Column widths are applied
                through the DOM so React does not replace that tbody.
              */}
              <NodeViewContent<"table"> as="table" />
              <TableColumnResizeOverlay
                tableRef={tableRef}
                editor={editor}
                getPos={getPos}
              />
            </Box>
          </Box>
        </Box>
        {/* Right lane for the add-column pill. Stays put while the table scrolls. */}
        <Box flex={`0 0 ${TABLE_GUTTER_PX}px`} aria-hidden />
      </Box>
    </Box>
  )
}
