import type { NodeViewProps } from "@tiptap/react"
import { Box } from "@chakra-ui/react"
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react"
import { TABLE_ADD_CHROME_PX } from "~/features/editing-experience/utils/tableEditorChrome"

import { TableCaption } from "./TableCaption"

export const TableNodeView = ({ node, updateAttributes }: NodeViewProps) => {
  const caption = (node.attrs.caption as string | undefined) ?? ""

  return (
    <Box
      as={NodeViewWrapper}
      display="flex"
      flexDirection="column"
      gap="0.5rem"
    >
      <Box contentEditable={false}>
        <TableCaption
          caption={caption}
          onCaptionChange={(nextCaption) =>
            updateAttributes({ caption: nextCaption })
          }
        />
      </Box>
      <Box pr={`${TABLE_ADD_CHROME_PX}px`} pb={`${TABLE_ADD_CHROME_PX}px`}>
        <NodeViewContent<"table"> as="table" />
      </Box>
    </Box>
  )
}
