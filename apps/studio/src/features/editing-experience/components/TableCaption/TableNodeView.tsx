import type { JSONContent, NodeViewProps } from "@tiptap/react"
import { Box } from "@chakra-ui/react"
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react"
import { TABLE_GUTTER_PX } from "~/features/editing-experience/utils/tableEditorChrome"

import { TableCaption } from "./TableCaption"

export const TableNodeView = ({
  node,
  updateAttributes,
  editor,
  getPos,
  extension,
}: NodeViewProps) => {
  const caption = (node.attrs.caption as string | undefined) ?? ""
  const isFocusEdit = Boolean(
    (extension.options as { focusEdit?: boolean }).focusEdit,
  )

  return (
    <Box as={NodeViewWrapper} display="flex" flexDirection="column">
      <Box contentEditable={false}>
        <TableCaption
          caption={caption}
          onCaptionChange={(nextCaption) =>
            updateAttributes({ caption: nextCaption })
          }
          editor={editor}
          getPos={getPos}
          table={node.toJSON() as JSONContent}
          showTableEditorButton={!isFocusEdit}
        />
      </Box>
      <Box p={`${TABLE_GUTTER_PX}px`}>
        <NodeViewContent<"table"> as="table" />
      </Box>
    </Box>
  )
}
