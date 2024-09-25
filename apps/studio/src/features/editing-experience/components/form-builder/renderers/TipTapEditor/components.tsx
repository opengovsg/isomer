import type { EditorContentProps, Editor as TiptapEditor } from "@tiptap/react"
import type { PropsWithChildren } from "react"
import { Box, VStack } from "@chakra-ui/react"
import { EditorContent } from "@tiptap/react"

import type { EditorMenuBar } from "~/components/PageEditor/MenuBar/MenuBar"

export const EditorContainer = ({ children }: PropsWithChildren) => {
  return (
    <Box wordBreak="break-all" h="100%">
      <VStack h="100%" w="100%" gap="0">
        {children}
      </VStack>
    </Box>
  )
}

export const EditorContentWrapper = ({
  editor,
}: Pick<EditorContentProps, "editor">) => {
  return (
    <Box
      as={EditorContent}
      editor={editor}
      w="100%"
      p="1.375rem"
      flex="1 1 auto"
      overflowX="hidden"
      overflowY="auto"
      minH="300px"
      backgroundColor="white"
      onClick={() => editor?.chain().focus().run()}
      cursor="text"
    />
  )
}

interface EditorProps {
  menubar: EditorMenuBar
  editor: TiptapEditor
}
export const Editor = ({ editor, menubar }: EditorProps) => {
  return (
    <EditorContainer>
      {menubar({ editor })}
      <EditorContentWrapper editor={editor} />
    </EditorContainer>
  )
}
