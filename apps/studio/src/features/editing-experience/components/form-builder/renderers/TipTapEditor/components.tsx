import type { BoxProps } from "@chakra-ui/react"
import type { EditorContentProps, Editor as TiptapEditor } from "@tiptap/react"
import type { PropsWithChildren, RefObject } from "react"
import type { EditorMenuBar } from "~/components/PageEditor/MenuBar/MenuBar"
import { Box, Flex, VStack } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { EditorContent } from "@tiptap/react"
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react"
import { TableBubbleMenu } from "~/features/editing-experience/components/TableBubbleMenu/TableBubbleMenu"
import {
  EXPANDED_TABLE_ATTR,
  ISOLATE_EXPANDED_TABLE_ATTR,
  placeSelectionInExpandedTable,
  registerTableExpand,
  setTableEditorExpanded,
  syncExpandedTableDom,
} from "~/features/editing-experience/components/TableCaption/expandTableEditor"
import { TableDragHandles } from "~/features/editing-experience/components/TableDragHandles"

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
      <VStack h="100%" w="100%" gap="0" minH={0}>
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
      minH={0}
      display="flex"
      flexDirection="column"
      overflowX="hidden"
      overflowY="auto"
      sx={{
        [`& .ProseMirror[${ISOLATE_EXPANDED_TABLE_ATTR}] > :not([${EXPANDED_TABLE_ATTR}])`]:
          {
            display: "none",
          },
      }}
    >
      <Box
        as={EditorContent}
        editor={editor}
        w="100%"
        flex="1 1 auto"
        minH="100%"
        display="flex"
        flexDirection="column"
        cursor="text"
        sx={{
          ".tiptap": {
            boxSizing: "border-box",
            flex: "1 1 auto",
            minHeight: "100%",
            padding: "1rem",
            backgroundColor: "white",
          },
        }}
      />
      {showTableExtras && (
        <TableDragHandles
          editor={editor}
          containerRef={containerRef}
          onDragStateChange={onDragStateChange}
        />
      )}
    </Box>
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
  const [expandedTablePos, setExpandedTablePos] = useState<number | null>(null)
  const expanded = expandedTablePos !== null
  const isTableEditor = editor.extensionManager.extensions.some(
    (ext) => ext.name === "table",
  )

  useEffect(() => registerTableExpand(editor, setExpandedTablePos), [editor])

  useLayoutEffect(() => {
    setTableEditorExpanded(editor, expandedTablePos)
    syncExpandedTableDom(editor, expandedTablePos)
    if (expandedTablePos !== null) {
      placeSelectionInExpandedTable(editor, expandedTablePos)
    }
    return () => {
      setTableEditorExpanded(editor, null)
      syncExpandedTableDom(editor, null)
    }
  }, [editor, expandedTablePos])

  return (
    <Box
      h={expanded ? "100vh" : "100%"}
      display={expanded ? "flex" : undefined}
      flexDirection={expanded ? "column" : undefined}
      position={expanded ? "fixed" : undefined}
      inset={expanded ? 0 : undefined}
      // Above the navbar (docked, 10) and below Chakra's portal wrapper (40),
      // so the portaled cell pencil paints on top of this layer.
      zIndex={expanded ? 30 : undefined}
      bg={expanded ? "base.canvas.default" : undefined}
      role={expanded ? "dialog" : undefined}
      aria-label={expanded ? "Expanded table" : undefined}
    >
      {expanded && (
        <Flex justify="flex-end" flexShrink={0} px="1rem" py="0.75rem">
          <Button variant="solid" onClick={() => setExpandedTablePos(null)}>
            Done
          </Button>
        </Flex>
      )}
      <Box
        flex={expanded ? "1" : undefined}
        minH={expanded ? 0 : undefined}
        h={expanded ? undefined : "100%"}
      >
        <EditorContainer isNested={isNested && !expanded}>
          {menubar({ editor })}
          {isTableEditor && (
            <TableBubbleMenu
              editor={editor}
              isDragReordering={isDragReordering}
              elevate={expanded}
            />
          )}
          <EditorContentWrapper
            editor={editor}
            containerRef={containerRef}
            showTableExtras={isTableEditor}
            onDragStateChange={setIsDragReordering}
          />
        </EditorContainer>
      </Box>
    </Box>
  )
}
