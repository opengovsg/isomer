import type { NodeViewProps } from "@tiptap/react"
import { Box } from "@chakra-ui/react"
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react"

import { TableCaption } from "./TableCaption"

/**
 * React node view for the `table` node: the caption sits above the table in
 * normal document flow, rendered by the same component that renders the table
 * itself.
 *
 * `NodeViewContent as="table"` hands the `<table>` element to ProseMirror,
 * which appends its own `<tbody>` (see `contentDOMElementTag` where this view
 * is registered) and manages the rows inside it. Everything outside that
 * element — the caption — is ours to render, and TipTap keeps it out of the
 * editable region.
 */
export const TableNodeView = ({ node, updateAttributes }: NodeViewProps) => {
  const caption = (node.attrs.caption as string | undefined) ?? ""

  return (
    <Box
      as={NodeViewWrapper}
      display="flex"
      flexDirection="column"
      gap="0.5rem"
    >
      {/* contentEditable=false keeps the caption row out of the editable
          region, so clicks reach the button instead of moving the cursor. */}
      <Box contentEditable={false}>
        <TableCaption
          caption={caption}
          onCaptionChange={(nextCaption) =>
            updateAttributes({ caption: nextCaption })
          }
        />
      </Box>
      {/* Explicit type argument: `NodeViewContent`'s `as` prop is `NoInfer`ed,
          so the tag has to be named on both sides. */}
      <NodeViewContent<"table"> as="table" />
    </Box>
  )
}
