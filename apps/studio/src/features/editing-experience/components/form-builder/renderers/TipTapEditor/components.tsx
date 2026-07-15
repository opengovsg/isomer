import type { BoxProps } from "@chakra-ui/react"
import type { EditorContentProps, Editor as TiptapEditor } from "@tiptap/react"
import type { PropsWithChildren, RefObject } from "react"
import type { EditorMenuBar } from "~/components/PageEditor/MenuBar/MenuBar"
import { Box, VStack } from "@chakra-ui/react"
import { EditorContent } from "@tiptap/react"
import { useCallback, useMemo, useRef } from "react"
import {
  hideTableBubbleMenu,
  revealTableBubbleMenu,
  TableBubbleMenu,
} from "~/features/editing-experience/components/TableBubbleMenu/TableBubbleMenu"
import { TABLE_EDITOR_OVERLAYS_ATTR } from "~/features/editing-experience/components/TableBubbleMenu/TableBubbleMenu.dom"
import { TableCaption } from "~/features/editing-experience/components/TableCaption/TableCaption"
import { TableDragHandles } from "~/features/editing-experience/components/TableDragHandles/TableDragHandles"

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
}: Pick<EditorContentProps, "editor"> & {
  containerRef: RefObject<HTMLDivElement>
  showTableExtras?: boolean
}) => {
  const handleTableDragStateChange = useCallback(
    (isDragging: boolean) => {
      if (!editor || editor.isDestroyed) return
      if (isDragging) {
        hideTableBubbleMenu(editor)
        return
      }
      revealTableBubbleMenu(editor)
    },
    [editor],
  )

  return (
    // `TableCaption`'s captions are absolutely positioned relative to
    // whichever element `containerRef` points to, computed from that
    // element's own bounding box — so `position: relative` + `containerRef`
    // must sit on the direct parent of the rendered table content, not on
    // `EditorContent` itself. `EditorContent` manages its inner DOM node
    // imperatively for ProseMirror (see `@tiptap/react`'s `EditorContent`
    // source) and doesn't render a `children` prop, so `TableCaption` can't
    // be nested inside it — it has to be a sibling within this wrapper.
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
        <>
          <TableCaption editor={editor} containerRef={containerRef} />
          <TableDragHandles
            editor={editor}
            containerRef={containerRef}
            onDragStateChange={handleTableDragStateChange}
          />
        </>
      )}
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
   * contextual table bubble menu, inline table captions, and row/column
   * drag handles; editors without table extensions (Prose, Callout,
   * SimpleProse) have no table nodes for any of them to react to, so
   * there's nothing for them to mount.
   */
  showTableExtras?: boolean
}
export const Editor = ({
  editor,
  menubar,
  isNested,
  showTableExtras,
}: EditorProps) => {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <EditorContainer isNested={isNested}>
      {menubar({ editor })}
      {showTableExtras && <TableBubbleMenu editor={editor} />}
      <EditorContentWrapper
        editor={editor}
        containerRef={containerRef}
        showTableExtras={showTableExtras}
      />
    </EditorContainer>
  )
}
