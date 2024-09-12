import { PropsWithChildren } from "react"
import { Box, VStack } from "@chakra-ui/react"
import {
  EditorContent,
  EditorContentProps,
  Editor as TiptapEditor,
} from "@tiptap/react"

import { EditorMenuBar } from "~/components/PageEditor/MenuBar/MenuBar"

export const EditorContainer = ({ children }: PropsWithChildren) => {
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

export const EditorContentWrapper = ({
  editor,
}: Pick<EditorContentProps, "editor">) => {
  return (
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
