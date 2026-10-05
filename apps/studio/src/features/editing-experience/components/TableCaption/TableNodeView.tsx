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
      <Box data-table-h-scroll="" overflowX="auto" w="100%">
        {/*
          Gutters sit inside the scroller. The add-column pill is pinned to the
          scrollport, so a wide table slides under it the same way cells can
          slide under the row handles.
        */}
        <Box p={`${TABLE_GUTTER_PX}px`}>
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
    </Box>
  )
}
