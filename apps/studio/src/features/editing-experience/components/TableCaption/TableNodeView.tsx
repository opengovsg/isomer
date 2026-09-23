import type { NodeViewProps } from "@tiptap/react"
import { Box } from "@chakra-ui/react"
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react"
import { readTableSiteId } from "~/features/editing-experience/hooks/useTextEditor/constants"
import { TABLE_GUTTER_PX } from "~/features/editing-experience/utils/tableEditorChrome"

import { TableCaption } from "./TableCaption"

export const TableNodeView = ({
  editor,
  node,
  updateAttributes,
}: NodeViewProps) => {
  const caption = (node.attrs.caption as string | undefined) ?? ""

  return (
    <Box as={NodeViewWrapper} display="flex" flexDirection="column">
      <Box contentEditable={false}>
        <TableCaption
          caption={caption}
          getSiteId={() => readTableSiteId(editor)}
          onCaptionChange={(nextCaption) =>
            updateAttributes({ caption: nextCaption })
          }
        />
      </Box>
      <Box p={`${TABLE_GUTTER_PX}px`}>
        <NodeViewContent<"table"> as="table" />
      </Box>
    </Box>
  )
}
