import type { BoxProps } from "@chakra-ui/react"
import type { EditorContentProps, Editor as TiptapEditor } from "@tiptap/react"
import type { PropsWithChildren, RefObject } from "react"
import type { EditorMenuBar } from "~/components/PageEditor/MenuBar/MenuBar"
import type { TableBubbleMenuAnchor } from "~/features/editing-experience/components/TableBubbleMenu/TableBubbleMenu.types"
import { Box, VStack } from "@chakra-ui/react"
import { EditorContent } from "@tiptap/react"
import { useMemo, useRef, useState } from "react"
import { useOptionalEditorDrawerSiteId } from "~/contexts/EditorDrawerContext"
import {
  DEFAULT_BRAND_CANVAS_INVERSE_COLOR,
  TableBubbleMenu,
} from "~/features/editing-experience/components/TableBubbleMenu/TableBubbleMenu"
import { TableDragHandles } from "~/features/editing-experience/components/TableDragHandles/TableDragHandles"
import {
  createTableDragHandlesBubbleMenuAnchor,
  TABLE_EDITOR_OVERLAYS_ATTR,
} from "~/features/editing-experience/components/TableDragHandles/TableDragHandles.bubbleMenu"
import { useSiteThemeCssVars } from "~/features/preview/hooks/useSiteThemeCssVars"

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
      {...{ [TABLE_EDITOR_OVERLAYS_ATTR]: "" }}
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
  )
}

const TableBubbleMenuThemed = ({
  editor,
  siteId,
  anchor,
  isDragReordering,
}: {
  editor: TiptapEditor
  siteId: number
  anchor?: TableBubbleMenuAnchor
  isDragReordering?: boolean
}) => {
  const themeCssVars = useSiteThemeCssVars({ siteId })
  const cssVars = themeCssVars as Record<string, string> | undefined
  const brandCanvasInverseColor =
    cssVars?.["--color-brand-canvas-inverse"] ??
    DEFAULT_BRAND_CANVAS_INVERSE_COLOR

  return (
    <TableBubbleMenu
      editor={editor}
      brandCanvasInverseColor={brandCanvasInverseColor}
      anchor={anchor}
      isDragReordering={isDragReordering}
    />
  )
}

interface EditorProps {
  menubar: EditorMenuBar
  editor: TiptapEditor
  isNested?: boolean
}

export const Editor = ({ editor, menubar, isNested }: EditorProps) => {
  const siteId = useOptionalEditorDrawerSiteId()
  const containerRef = useRef<HTMLDivElement>(null)
  const [isDragReordering, setIsDragReordering] = useState(false)
  const isTableEditor = editor.extensionManager.extensions.some(
    (ext) => ext.name === "table",
  )
  const tableBubbleMenuAnchor = useMemo(
    () =>
      isTableEditor
        ? createTableDragHandlesBubbleMenuAnchor(editor)
        : undefined,
    [editor, isTableEditor],
  )

  return (
    <EditorContainer isNested={isNested}>
      {menubar({ editor })}
      {isTableEditor &&
        (siteId !== undefined ? (
          <TableBubbleMenuThemed
            editor={editor}
            siteId={siteId}
            anchor={tableBubbleMenuAnchor}
            isDragReordering={isDragReordering}
          />
        ) : (
          <TableBubbleMenu
            editor={editor}
            anchor={tableBubbleMenuAnchor}
            isDragReordering={isDragReordering}
          />
        ))}
      <EditorContentWrapper
        editor={editor}
        containerRef={containerRef}
        showTableExtras={isTableEditor}
        onDragStateChange={setIsDragReordering}
      />
    </EditorContainer>
  )
}
