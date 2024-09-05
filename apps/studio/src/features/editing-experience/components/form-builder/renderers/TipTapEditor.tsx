import { PropsWithChildren } from "react"
import { Box, VStack } from "@chakra-ui/react"
import { EditorContent } from "@tiptap/react"

import {
  AccordionMenuBar,
  CalloutMenuBar,
  TextMenuBar,
} from "~/components/PageEditor/MenuBar"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"

const EditorContainer = ({ children }: PropsWithChildren) => {
  return (
    <Box backgroundColor="gray.50" wordBreak="break-all">
      <VStack
        border="1px solid"
        borderColor="base.divider.strong"
        h="100%"
        w="100%"
        gap="0"
      >
        {children}
      </VStack>
    </Box>
  )
}

export function TiptapTextEditor({
  editor,
}: {
  editor: ReturnType<typeof useTextEditor>
}) {
  // TODO: Add a loading state or use suspsense
  if (!editor) return null

  return (
    <EditorContainer>
      <TextMenuBar editor={editor} />
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
    </EditorContainer>
  )
}

export function TiptapAccordionEditor({
  editor,
}: {
  editor: ReturnType<typeof useTextEditor>
}) {
  // TODO: Add a loading state or use suspsense
  if (!editor) return null

  return (
    <EditorContainer>
      <AccordionMenuBar editor={editor} />
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
    </EditorContainer>
  )
}

export function TiptapCalloutEditor({
  editor,
}: {
  editor: ReturnType<typeof useTextEditor>
}) {
  // TODO: Add a loading state or use suspsense
  if (!editor) return null

  return (
    <EditorContainer>
      <CalloutMenuBar editor={editor} />
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
    </EditorContainer>
  )
}
