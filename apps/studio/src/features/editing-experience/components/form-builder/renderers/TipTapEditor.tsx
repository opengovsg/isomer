import type { BoxProps } from '@chakra-ui/react';
import { Box, VStack } from '@chakra-ui/react'
import { HardBreak } from '@tiptap/extension-hard-break'
import { Blockquote } from '@tiptap/extension-blockquote'
import { Bold } from '@tiptap/extension-bold'
import { BulletList } from '@tiptap/extension-bullet-list'
import { Document } from '@tiptap/extension-document'
import { Dropcursor } from '@tiptap/extension-dropcursor'
import { Gapcursor } from '@tiptap/extension-gapcursor'
import { Heading } from '@tiptap/extension-heading'
import { History } from '@tiptap/extension-history'
import { HorizontalRule } from '@tiptap/extension-horizontal-rule'
import { Italic } from '@tiptap/extension-italic'
import { ListItem } from '@tiptap/extension-list-item'
import { OrderedList } from '@tiptap/extension-ordered-list'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Strike } from '@tiptap/extension-strike'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { Text } from '@tiptap/extension-text'
import type {
  JSONContent
} from '@tiptap/react';
import {
  EditorContent,
  useEditor
} from '@tiptap/react'
import Underline from '@tiptap/extension-underline'
import { MenuBar } from '~/components/PageEditor/MenuBar'
import type { ControlProps } from '@jsonforms/core'

interface TiptapEditorProps extends BoxProps {
  data: ControlProps["data"]
  handleChange: (content: JSONContent) => void
}

export function TiptapEditor({
  data,
  handleChange,
}: TiptapEditorProps) {

  const editor = useEditor({
    extensions: [
      Blockquote,
      Bold,
      BulletList.extend({
        name: 'unorderedList',
      }).configure({
        HTMLAttributes: {
          class: "list-disc",
        },
      }),
      Document.extend({
        name: 'prose',
      }),
      Dropcursor,
      Gapcursor,
      HardBreak,
      Heading.configure({
        levels: [2, 3, 4, 6]
      }),
      History,
      HorizontalRule.extend({
        name: "divider",
      }),
      Italic,
      ListItem,
      OrderedList.extend({
        name: 'orderedList',
      }).configure({
        HTMLAttributes: {
          class: "list-decimal",
        },
      }),
      Paragraph,
      Strike,
      Superscript,
      Subscript,
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
    <Box
      backgroundColor="gray.50"
    >
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

