import type { Editor, JSONContent } from "@tiptap/react"
import {
  Box,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
} from "@chakra-ui/react"
import { Button, ModalCloseButton } from "@opengovsg/design-system-react"
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
}

export const TableFocusEditorModal = ({
  table,
  parentEditor,
  getPos,
  isOpen,
  onClose,
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

  const handleClose = () => {
    commitFocusedTableEdit(parentEditor, getPos, docRef.current)
    onClose()
  }

  return (
    // trapFocus off: the table bubble menu and link menu are portaled outside
    // this dialog, and Chakra's focus lock swallows Tab into those menus.
    <Modal isOpen={isOpen} onClose={handleClose} size="full" trapFocus={false}>
      <ModalOverlay />
      <ModalContent
        my="1.5rem"
        h="calc(100vh - 3rem)"
        minH="0"
        maxW="calc(100vw - 3rem)"
        borderRadius="0.25rem"
        overflow="hidden"
        display="flex"
        flexDirection="column"
      >
        <ModalHeader mr="3.5rem">Edit table</ModalHeader>
        <ModalCloseButton size="lg" />
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
        <ModalFooter>
          <Button variant="solid" onClick={handleClose}>
            Done
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
