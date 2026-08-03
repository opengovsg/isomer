import type { BoxProps } from "@chakra-ui/react"
import type { EditorContentProps, Editor as TiptapEditor } from "@tiptap/react"
import type { PropsWithChildren } from "react"
import type { EditorMenuBar } from "~/components/PageEditor/MenuBar/MenuBar"
import { Box, VStack } from "@chakra-ui/react"
import { EditorContent } from "@tiptap/react"
import { useMemo } from "react"
import { TableBubbleMenu } from "~/features/editing-experience/components/TableBubbleMenu/TableBubbleMenu"

const EditorContainer = ({
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

const EditorContentWrapper = ({
  editor,
}: Pick<EditorContentProps, "editor">) => {
  return (
    <Box
      position="relative"
      w="100%"
      flex="1 1 auto"
      overflowX="hidden"
      overflowY="auto"
    >
      <Box
        as={EditorContent}
        editor={editor}
        w="100%"
        p="1rem"
        backgroundColor="white"
        onClick={() => editor?.chain().focus().run()}
        cursor="text"
      />
    </Box>
  )
}

interface EditorProps {
  menubar: EditorMenuBar
  editor: TiptapEditor
  isNested?: boolean
  /**
   * Only editors whose extensions include tables (currently
   * `useTextEditor`/`TiptapTextEditor` and
   * `useAccordionEditor`/`TiptapAccordionEditor` — see
   * `hooks/useTextEditor/useTextEditor.ts`) should set this. It mounts the
   * contextual table bubble menu; editors without table extensions (Prose,
   * Callout, SimpleProse) have no table nodes for it to react to, so there's
   * nothing for it to mount. Inline table captions need no wiring here — they
   * are rendered by the `table` node view itself (`TableNodeView`).
   */
  showTableExtras?: boolean
}
export const Editor = ({
  editor,
  menubar,
  isNested,
  showTableExtras,
}: EditorProps) => {
  return (
    <EditorContainer isNested={isNested}>
      {menubar({ editor })}
      {showTableExtras && <TableBubbleMenu editor={editor} />}
      <EditorContentWrapper editor={editor} />
    </EditorContainer>
  )
}
