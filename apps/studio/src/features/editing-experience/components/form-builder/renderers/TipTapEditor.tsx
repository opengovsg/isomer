import { Box, VStack } from "@chakra-ui/react"
import { EditorContent } from "@tiptap/react"

import { TextMenuBar } from "~/components/PageEditor/MenuBar"
import { useTextEditor } from "~/features/editing-experience/hooks/useTextEditor"

export function TiptapEditor({
  editor,
}: {
  editor: ReturnType<typeof useTextEditor>
}) {
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
      </VStack>
    </Box>
  )
}
