import type { BoxProps } from "@chakra-ui/react"
import type { ControlProps } from "@jsonforms/core"
import type { Level } from "@tiptap/extension-heading"
import type { JSONContent } from "@tiptap/react"
import { Box, VStack } from "@chakra-ui/react"
import { Bold } from "@tiptap/extension-bold"
import { BulletList } from "@tiptap/extension-bullet-list"
import { Document } from "@tiptap/extension-document"
import { Dropcursor } from "@tiptap/extension-dropcursor"
import { Gapcursor } from "@tiptap/extension-gapcursor"
import { HardBreak } from "@tiptap/extension-hard-break"
import { Heading } from "@tiptap/extension-heading"
import { History } from "@tiptap/extension-history"
import { HorizontalRule } from "@tiptap/extension-horizontal-rule"
import { Italic } from "@tiptap/extension-italic"
import { Link } from "@tiptap/extension-link"
import { ListItem } from "@tiptap/extension-list-item"
import { OrderedList } from "@tiptap/extension-ordered-list"
import { Paragraph } from "@tiptap/extension-paragraph"
import { Strike } from "@tiptap/extension-strike"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import { Table } from "@tiptap/extension-table"
import { TableCell } from "@tiptap/extension-table-cell"
import { TableHeader } from "@tiptap/extension-table-header"
import { TableRow } from "@tiptap/extension-table-row"
import { Text } from "@tiptap/extension-text"
import { Underline } from "@tiptap/extension-underline"
import { EditorContent, textblockTypeInputRule, useEditor } from "@tiptap/react"

import { MenuBar } from "~/components/PageEditor/MenuBar"

interface TiptapEditorProps extends BoxProps {
  data: ControlProps["data"]
  handleChange: (content: JSONContent) => void
}

const HEADING_LEVELS: Level[] = [2, 3, 4, 5, 6]

export function TiptapEditor({ data, handleChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      Link,
      Bold,
      BulletList.extend({
        name: "unorderedList",
      }).configure({
        HTMLAttributes: {
          class: "list-disc",
        },
      }),
      Document.extend({
        name: "prose",
      }),
      Dropcursor,
      Gapcursor,
      HardBreak,
      Heading.extend({
        marks: "",
        // NOTE: Have to override the default input rules
        // because we should map the number of `#` into
        // a h<num # + 1>.
        // eg: # -> h2
        //     ## -> h3
        addInputRules() {
          return HEADING_LEVELS.map((level) => {
            return textblockTypeInputRule({
              find: new RegExp(`^(#{1,${level - 1}})\\s$`),
              type: this.type,
              getAttributes: {
                level,
              },
            })
          })
        },
      }).configure({
        levels: HEADING_LEVELS,
      }),
      History,
      HorizontalRule.extend({
        name: "divider",
      }),
      Italic,
      ListItem,
      OrderedList.extend({
        name: "orderedList",
      }).configure({
        HTMLAttributes: {
          class: "list-decimal",
        },
      }),
      Paragraph,
      Strike,
      Superscript,
      Subscript,
      Table.extend({
        addAttributes() {
          return {
            caption: {
              default: "Table caption",
            },
          }
        },
      }),
      TableCell,
      TableHeader.extend({
        content: "paragraph+",
      }),
      TableRow,
      Text,
      Underline,
    ],
    content: data,
    onUpdate: (e) => {
      const jsonContent = e.editor.getJSON()
      handleChange(jsonContent)
    },
  })

  // TODO: Add a loading state or use suspsense
  if (!editor) return null

  return (
    <Box backgroundColor="gray.50" wordBreak="break-all">
      <VStack
        border="1px solid"
        borderColor="base.divider.strong"
        h="100%"
        w="100%"
        gap="0"
      >
        <MenuBar editor={editor} />
        <Box
          as={EditorContent}
          editor={editor}
          w="100%"
          p="1rem"
          flex="1 1 auto"
          overflowX="hidden"
          overflowY="auto"
          minH="300px"
          backgroundColor="white"
          onClick={() => editor.chain().focus().run()}
          cursor="text"
        />
      </VStack>
    </Box>
  )
}
