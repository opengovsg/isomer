import type { ProseProps } from "@opengovsg/isomer-components/dist/cjs/interfaces"
import type { JSONContent } from "@tiptap/react"
import { Box, Text as ChakraText, Flex, Icon, VStack } from "@chakra-ui/react"
import { Button, IconButton } from "@opengovsg/design-system-react"
import { Blockquote } from "@tiptap/extension-blockquote"
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
import { ListItem } from "@tiptap/extension-list-item"
import { OrderedList } from "@tiptap/extension-ordered-list"
import { Paragraph } from "@tiptap/extension-paragraph"
import { Strike } from "@tiptap/extension-strike"
import { Subscript } from "@tiptap/extension-subscript"
import { Superscript } from "@tiptap/extension-superscript"
import TableCell from "@tiptap/extension-table-cell"
import TableHeader from "@tiptap/extension-table-header"
import TableRow from "@tiptap/extension-table-row"
import { Text } from "@tiptap/extension-text"
import Underline from "@tiptap/extension-underline"
import { EditorContent, useEditor } from "@tiptap/react"
import { cloneDeep } from "lodash"
import { BiText, BiX } from "react-icons/bi"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { TiptapEditor } from "./form-builder/renderers/TipTapEditor"

interface TipTapComponentProps {
  content: ProseProps
}

function TipTapComponent({ content }: TipTapComponentProps) {
  const {
    setDrawerState,
    savedPageState,
    setSavedPageState,
    previewPageState,
    setPreviewPageState,
    currActiveIdx,
  } = useEditorDrawerContext()

  const updatePageState = (editorContent: JSONContent) => {
    // TODO: actual validation
    const content = editorContent as ProseProps
    setPreviewPageState((oldState) => {
      // TODO: performance - this is a full clone
      // of the object, which is expensive
      const newState = cloneDeep(oldState)
      newState[currActiveIdx] = content
      return newState
    })
  }

  const editor = useEditor({
    extensions: [
      Blockquote,
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
      Heading.configure({
        levels: [2, 3, 4, 6],
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
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Text,
      Underline,
    ],
    content,
    onUpdate: (e) => {
      const jsonContent = e.editor.getJSON()
      updatePageState(jsonContent)
    },
  })

  // TODO: Add a loading state or use suspsense
  if (!editor) return null
  return (
    <VStack bg="white" h="100%" gap="0">
      <Flex
        px="2rem"
        py="1.25rem"
        borderBottom="1px solid"
        borderColor="base.divider.strong"
        w="100%"
        alignItems="center"
      >
        <Icon as={BiText} color="blue.600" />
        <ChakraText pl="0.75rem" textStyle="h5" w="100%">
          Prose
        </ChakraText>
        <IconButton
          size="lg"
          variant="clear"
          colorScheme="neutral"
          color="interaction.sub.default"
          aria-label="Close add component"
          icon={<BiX />}
          onClick={() => {
            setDrawerState({ state: "root" })
            setPreviewPageState(savedPageState)
          }}
        />
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
            maxW="30vw"
            flex="1 1 auto"
            overflowX="hidden"
            overflowY="auto"
            px="2rem"
            py="1rem"
            h="100%"
            backgroundColor="white"
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
        <Button
          onClick={() => {
            setDrawerState({ state: "root" })
            setSavedPageState(previewPageState)
          }}
        >
          Save
        </Button>
      </Flex>
    </VStack>
  )
}

export default TipTapComponent
