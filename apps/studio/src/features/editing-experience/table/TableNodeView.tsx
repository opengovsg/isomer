import type { NodeViewProps } from "@tiptap/react"
import { Box } from "@chakra-ui/react"
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react"
import { useRef } from "react"
import { TableCaption } from "~/features/editing-experience/components/TableCaption/TableCaption"
import { TABLE_GUTTER_PX } from "~/features/editing-experience/utils/tableEditorChrome"

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
      <Box p={`${TABLE_GUTTER_PX}px`} w="100%">
        <Box
          ref={(element) => {
            tableRef.current = element?.querySelector("table") ?? null
          }}
          position="relative"
          w="100%"
        >
          {/*
            TipTap appends a tbody (contentDOMElementTag) into this table.
            Colgroup is applied via DOM so React does not replace that tbody.
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
  )
}
