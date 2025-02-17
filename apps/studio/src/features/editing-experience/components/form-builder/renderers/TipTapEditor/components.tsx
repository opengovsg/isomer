import type { BoxProps } from "@chakra-ui/react"
import type { EditorContentProps, Editor as TiptapEditor } from "@tiptap/react"
import type { PropsWithChildren } from "react"
import { useMemo } from "react"
import { Box, VStack } from "@chakra-ui/react"
import { EditorContent } from "@tiptap/react"

import type { EditorMenuBar } from "~/components/PageEditor/MenuBar/MenuBar"

export const EditorContainer = ({
  children,
  isNested,
}: PropsWithChildren<{ isNested?: boolean }>) => {
  const containerProps: Partial<BoxProps> = useMemo(() => {
    if (isNested) {
      return {
        height: "22.5rem",
        borderRadius: "4px",
        overflow: "hidden",
        border: "1px solid",
        borderColor: "base.divider.strong",
        _groupFocusWithin: {
          borderColor: "utility.focus-default",
          boxShadow: `0 0 0 1px #1361F0`,
        },
      }
    }
    return {}
  }, [isNested])

  return (
    <Box
      wordBreak="break-word"
      h="100%"
      transitionProperty="common"
      transitionDuration="normal"
      {...containerProps}
    >
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
      p="1rem"
      flex="1 1 auto"
      overflowX="hidden"
      overflowY="auto"
      backgroundColor="white"
      onClick={() => editor?.chain().focus().run()}
      cursor="text"
    />
  )
}

interface EditorProps {
  menubar: EditorMenuBar
  editor: TiptapEditor
  isNested?: boolean
}
export const Editor = ({ editor, menubar, isNested }: EditorProps) => {
  return (
    <EditorContainer isNested={isNested}>
      {menubar({ editor })}
      <EditorContentWrapper editor={editor} />
    </EditorContainer>
  )
}
