import { Box, Flex, VStack } from '@chakra-ui/react'
import { Button } from '@opengovsg/design-system-react'
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
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import { EditorContent, useEditor } from '@tiptap/react'
// import type { CustomRendererProps } from './types'
import { MenuBar } from '~/components/PageEditor/MenuBar'

import { Table } from './extensions/Table'

export interface TipTapComponentProps {
  data: any
  handleChange(path: string, value: any): void
  onProceed(path: string, value: any): void
  path: string
}

const TipTapComponent = ({
  data,
  handleChange,
  onProceed,
  path,
}: TipTapComponentProps) => {
  const editor = useEditor({
    extensions: [
      // Blockquote,
      Bold,
      BulletList.extend({
        name: 'unorderedlist',
      }),
      BulletList.configure({
        HTMLAttributes: {
          class: 'list-disc',
        },
      }),
      // Code,
      // CodeBlock,
      Document,
      Dropcursor,
      Gapcursor,
      // HardBreak,
      Heading,
      History,
      HorizontalRule.extend({
        name: 'divider',
      }),
      Italic,
      ListItem,
      OrderedList.extend({
        name: 'orderedlist',
      }),
      OrderedList.configure({
        HTMLAttributes: {
          class: 'list-decimal',
        },
      }),
      Paragraph,
      Strike,
      Superscript,
      Subscript,
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Text,
    ],
    content: data,
    onUpdate({ editor }) {
      handleChange(path, editor.getJSON().content)
    },
  })

  if (!editor) return <></>
  return (
    <VStack bg="white" h="100%" gap="0">
      <Flex
        px="2rem"
        py="1.25rem"
        borderBottom="1px solid"
        borderColor="base.divider.strong"
        w="100%"
      >
        Header
      </Flex>
      <Box
        p="2rem"
        h="100%"
        backgroundColor="gray.50"
        flex="1"
        maxH="calc(100vh - 12.875rem)"
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
            flex="1 1 auto"
            overflowX="hidden"
            overflowY="auto"
            px="2rem"
            py="1rem"
            h="100%"
            backgroundColor={'white'}
            onClick={() => editor.chain().focus().run()}
            cursor="text"
          />
        </VStack>
      </Box>
      <Flex
        px="2rem"
        py="1.25rem"
        borderTop="1px solid"
        borderColor="base.divider.strong"
        w="100%"
        justifyContent="end"
      >
        <Button onClick={() => onProceed(path, editor.getJSON().content)}>
          Save
        </Button>
      </Flex>
    </VStack>
  )
}

export default TipTapComponent
