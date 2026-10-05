import type { NodeViewProps } from "@tiptap/react"
import { Box } from "@chakra-ui/react"
import { validateTableColumnWidths } from "@opengovsg/isomer-components"
import { NodeViewContent, NodeViewWrapper } from "@tiptap/react"
import { TableMap } from "@tiptap/pm/tables"
import { TABLE_GUTTER_PX } from "~/features/editing-experience/utils/tableEditorChrome"

import { TableCaption } from "./TableCaption"

export const TableNodeView = ({ node, updateAttributes }: NodeViewProps) => {
  const caption = (node.attrs.caption as string | undefined) ?? ""
  const map = TableMap.get(node)
  const columnWidths = validateTableColumnWidths(
    node.attrs.columnWidths,
    map.width,
  )
  const tableWidthPx = columnWidths?.reduce((sum, width) => sum + width, 0)

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
      <Box overflowX="auto" w="100%">
        <Box p={`${TABLE_GUTTER_PX}px`} display="inline-block" minW="100%">
          <Box
            as="table"
            className={
              columnWidths ? "isomer-table--author-sized" : undefined
            }
            style={
              columnWidths && tableWidthPx
                ? { width: `${tableWidthPx}px` }
                : undefined
            }
          >
            {columnWidths && (
              <Box as="colgroup" contentEditable={false}>
                {columnWidths.map((width, index) => (
                  <Box
                    as="col"
                    key={index}
                    contentEditable={false}
                    style={{ width: `${width}px` }}
                  />
                ))}
              </Box>
            )}
            <NodeViewContent as="tbody" />
          </Box>
        </Box>
      </Box>
    </Box>
  )
}
