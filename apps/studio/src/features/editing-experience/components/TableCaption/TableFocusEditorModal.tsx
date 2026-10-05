import type { Editor, JSONContent } from "@tiptap/react"
import {
  Box,
  Modal,
  ModalBody,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { useEffect, useRef } from "react"
import { TableMenuBar } from "~/components/PageEditor/MenuBar/TableMenuBar"
import { Editor as TiptapEditorSurface } from "~/features/editing-experience/components/form-builder/renderers/TipTapEditor/components"
import { useTableFocusEditor } from "~/features/editing-experience/hooks/useTextEditor"

import { commitFocusedTableEdit } from "./commitFocusedTableEdit"

interface TableFocusEditorModalProps {
  table: JSONContent
  parentEditor: Editor
  getPos: () => number | undefined
  isOpen: boolean
  onClose: () => void
  onExited: () => void
}

export const TableFocusEditorModal = ({
  table,
  parentEditor,
  getPos,
  isOpen,
  onClose,
  onExited,
}: TableFocusEditorModalProps) => {
  const docRef = useRef<JSONContent>({
    type: "prose",
    content: [table],
  })
  const editor = useTableFocusEditor({
    data: docRef.current,
    handleChange: (next) => {
      if (next) docRef.current = next
    },
  })

  useEffect(() => {
    editor?.commands.focus("start")
  }, [editor])

  const handleCloseComplete = () => {
    // Save after the exit transition so replacing the table node does not
    // tear down this dialog mid-animation.
    commitFocusedTableEdit(parentEditor, getPos, docRef.current)
    onExited()
  }

  return (
    // trapFocus off: the table bubble menu and link menu are portaled outside
    // this dialog, and Chakra's focus lock swallows Tab into those menus.
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      onCloseComplete={handleCloseComplete}
      closeOnEsc={false}
      size="full"
      trapFocus={false}
    >
      <ModalOverlay />
      <ModalContent
        height="$100vh"
        overflow="hidden"
        display="flex"
        flexDirection="column"
      >
        <ModalHeader mr="6rem">Edit table</ModalHeader>
        <Button
          position="absolute"
          top="0.75rem"
          right="1rem"
          zIndex={1}
          variant="solid"
          onClick={onClose}
        >
          Done
        </Button>
        <ModalBody flex="1" minH="0" display="flex" p="0" overflow="hidden">
          <Box flex="1" minH="0" h="100%" w="100%">
            {editor && (
              <TiptapEditorSurface
                editor={editor}
                menubar={TableMenuBar}
                elevateTableBubbleMenu
              />
            )}
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  )
}
