import type { BoxProps } from "@chakra-ui/react"
import type { EditorContentProps, Editor as TiptapEditor } from "@tiptap/react"
import type { PropsWithChildren, RefObject } from "react"
import type { EditorMenuBar } from "~/components/PageEditor/MenuBar/MenuBar"
import {
  Box,
  Flex,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  VisuallyHidden,
  VStack,
} from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { EditorContent } from "@tiptap/react"
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react"
import { TableBubbleMenu } from "~/features/editing-experience/components/TableBubbleMenu/TableBubbleMenu"
import { TableDragHandles } from "~/features/editing-experience/components/TableDragHandles"

import { ExpandedTableMenuBar } from "./ExpandedTableMenuBar"
import {
  EXPANDED_TABLE_ATTR,
  ISOLATE_EXPANDED_TABLE_ATTR,
  getExpandedTablePos,
  setTableEditorExpanded,
  subscribeTableEditorExpanded,
  syncExpandedTableDom,
} from "./expandTableEditor"

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
  expandedTablePos,
}: Pick<EditorContentProps, "editor"> & {
  containerRef: RefObject<HTMLDivElement>
  showTableExtras?: boolean
  onDragStateChange?: (isDragging: boolean) => void
  expandedTablePos: number | null
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
          expandedTablePos={expandedTablePos}
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
  const dialogRef = useRef<HTMLElement>(null)
  const isClosingDialogRef = useRef(false)
  const [isDragReordering, setIsDragReordering] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const expandedTablePos = useSyncExternalStore(
    (listener) => subscribeTableEditorExpanded(editor, listener),
    () => getExpandedTablePos(editor),
    () => null,
  )
  const editorInDialog = expandedTablePos !== null
  const isTableEditor = editor.extensionManager.extensions.some(
    (ext) => ext.name === "table",
  )

  if (editorInDialog && !isDialogOpen && !isClosingDialogRef.current) {
    setIsDialogOpen(true)
  }
  if (!editorInDialog && isDialogOpen && !isClosingDialogRef.current) {
    setIsDialogOpen(false)
  }

  useEffect(() => {
    return () => {
      setTableEditorExpanded(editor, null)
    }
  }, [editor])

  useLayoutEffect(() => {
    syncExpandedTableDom(editor, expandedTablePos)
    return () => {
      syncExpandedTableDom(editor, null)
    }
  }, [editor, expandedTablePos])

  useEffect(() => {
    if (!editorInDialog || !isDialogOpen) return
    editor.commands.focus()
  }, [editor, editorInDialog, isDialogOpen])

  const requestClose = () => {
    isClosingDialogRef.current = true
    setIsDialogOpen(false)
  }

  const finishClose = () => {
    if (!isClosingDialogRef.current) return
    isClosingDialogRef.current = false
    setTableEditorExpanded(editor, null)
  }

  const editorFrame = (
    <Box
      flex={editorInDialog ? "1" : undefined}
      minH={editorInDialog ? 0 : undefined}
      h="100%"
      display="flex"
      flexDirection="column"
    >
      <EditorContainer isNested={isNested && !editorInDialog}>
        {editorInDialog ? (
          <ExpandedTableMenuBar editor={editor} />
        ) : (
          menubar({ editor })
        )}
        {isTableEditor && (
          <TableBubbleMenu
            editor={editor}
            isDragReordering={isDragReordering}
            portalContainerRef={editorInDialog ? dialogRef : undefined}
          />
        )}
        <EditorContentWrapper
          editor={editor}
          containerRef={containerRef}
          showTableExtras={isTableEditor}
          onDragStateChange={setIsDragReordering}
          expandedTablePos={expandedTablePos}
        />
      </EditorContainer>
    </Box>
  )

  return (
    <>
      <Modal
        isOpen={isDialogOpen}
        onClose={requestClose}
        onCloseComplete={finishClose}
        closeOnEsc={false}
        closeOnOverlayClick={false}
        autoFocus={false}
        motionPreset="scale"
        size="full"
        scrollBehavior="inside"
      >
        <ModalOverlay />
        <ModalContent
          ref={dialogRef}
          containerProps={{
            // Above the navbar (docked, 10) and below the dropdown layer, so
            // the cell pencil paints on top of this dialog.
            zIndex: 30,
          }}
          m={0}
          h="100vh"
          maxH="100vh"
          maxW="100vw"
          borderRadius={0}
          display="flex"
          flexDirection="column"
        >
          {editorInDialog && (
            <>
              <ModalHeader p={0} m={0}>
                <VisuallyHidden>Expanded table</VisuallyHidden>
              </ModalHeader>
              <Flex justify="flex-end" flexShrink={0} px="1rem" py="0.75rem">
                <Button variant="solid" onClick={requestClose}>
                  Done
                </Button>
              </Flex>
              <ModalBody
                p={0}
                flex="1"
                minH={0}
                overflow="hidden"
                display="flex"
                flexDirection="column"
              >
                {editorFrame}
              </ModalBody>
            </>
          )}
        </ModalContent>
      </Modal>
      {editorInDialog ? null : editorFrame}
    </>
  )
}
