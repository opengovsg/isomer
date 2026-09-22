import type { BoxProps } from "@chakra-ui/react"
import type { EditorContentProps, Editor as TiptapEditor } from "@tiptap/react"
import type { PropsWithChildren, RefObject } from "react"
import type { EditorMenuBar } from "~/components/PageEditor/MenuBar/MenuBar"
import { Box, VStack } from "@chakra-ui/react"
import { EditorContent } from "@tiptap/react"
import { useMemo, useRef, useState } from "react"
import { TableBubbleMenu } from "~/features/editing-experience/components/TableBubbleMenu/TableBubbleMenu"
<<<<<<< HEAD
import { TableDragHandles } from "~/features/editing-experience/components/TableDragHandles"
=======
import { tryFocusBelowEditorContent } from "~/features/editing-experience/hooks/useTextEditor/ensureTrailingParagraphAfterTable"
>>>>>>> 57e747165 (fix(rte-table): insert paragraph when clicking below a table-last block)

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
  containerRef,
  showTableExtras,
  onDragStateChange,
}: Pick<EditorContentProps, "editor"> & {
  containerRef: RefObject<HTMLDivElement>
  showTableExtras?: boolean
  onDragStateChange?: (isDragging: boolean) => void
}) => {
  return (
    <Box
      ref={containerRef}
      position="relative"
      w="100%"
      flex="1 1 auto"
      overflowX="hidden"
      overflowY="auto"
<<<<<<< HEAD
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
      {showTableExtras && (
        <TableDragHandles
          editor={editor}
          containerRef={containerRef}
          onDragStateChange={onDragStateChange}
        />
      )}
    </Box>
=======
      backgroundColor="white"
      onClick={() => editor?.chain().focus().run()}
      cursor="text"
      onMouseDown={(event) => {
        if (!editor || event.button !== 0) return

        const target = event.target
        if (target instanceof Node && editor.view.dom.contains(target)) {
          return
        }

        if (tryFocusBelowEditorContent(editor.view, event.nativeEvent)) {
          event.preventDefault()
        }
      }}
    />
>>>>>>> 57e747165 (fix(rte-table): insert paragraph when clicking below a table-last block)
  )
}

interface EditorProps {
  menubar: EditorMenuBar
  editor: TiptapEditor
  isNested?: boolean
}

export const Editor = ({ editor, menubar, isNested }: EditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragReordering, setIsDragReordering] = useState(false)
  const isTableEditor = editor.extensionManager.extensions.some(
    (ext) => ext.name === "table",
  )

  return (
    <EditorContainer isNested={isNested}>
      {menubar({ editor })}
      {isTableEditor && (
        <TableBubbleMenu editor={editor} isDragReordering={isDragReordering} />
      )}
      <EditorContentWrapper
        editor={editor}
        containerRef={containerRef}
        showTableExtras={isTableEditor}
        onDragStateChange={setIsDragReordering}
      />
    </EditorContainer>
  )
}
