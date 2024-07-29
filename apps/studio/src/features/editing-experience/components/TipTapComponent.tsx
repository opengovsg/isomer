import type { ProseProps } from "@opengovsg/isomer-components/dist/cjs/interfaces"
import type { JSONContent } from "@tiptap/react"
import {
  Box,
  Text as ChakraText,
  Flex,
  HStack,
  Icon,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { Button, IconButton } from "@opengovsg/design-system-react"
import { cloneDeep } from "lodash"
import { BiText, BiTrash, BiX } from "react-icons/bi"

import { PROSE_COMPONENT_NAME } from "~/constants/formBuilder"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { DeleteBlockModal } from "./DeleteBlockModal"
import { TiptapEditor } from "./form-builder/renderers/TipTapEditor"

interface TipTapComponentProps {
  content: ProseProps
}

function TipTapComponent({ content }: TipTapComponentProps) {
  const {
    setDrawerState,
    savedPageState,
    setSavedPageState,
    previewPageState,
    setPreviewPageState,
    currActiveIdx,
  } = useEditorDrawerContext()
  const {
    isOpen: isDeleteBlockModalOpen,
    onOpen: onDeleteBlockModalOpen,
    onClose: onDeleteBlockModalClose,
  } = useDisclosure()

  const updatePageState = (editorContent: JSONContent) => {
    // TODO: actual validation
    const content = editorContent as ProseProps
    setPreviewPageState((oldState) => {
      // TODO: performance - this is a full clone
      // of the object, which is expensive
      const newState = cloneDeep(oldState)
      newState[currActiveIdx] = content
      return newState
    })
  }

  const handleDeleteBlock = () => {
    const updatedBlocks = Array.from(savedPageState)
    updatedBlocks.splice(currActiveIdx, 1)
    setSavedPageState(updatedBlocks)
    setPreviewPageState(updatedBlocks)
    onDeleteBlockModalClose()
    setDrawerState({ state: "root" })
  }

  // TODO: Add a loading state or use suspsense
  return (
    <>
      <DeleteBlockModal
        itemName={PROSE_COMPONENT_NAME}
        isOpen={isDeleteBlockModalOpen}
        onClose={onDeleteBlockModalClose}
        onDelete={handleDeleteBlock}
      />

      <VStack bg="white" h="100%" gap="0">
        <Flex
          px="2rem"
          py="1.25rem"
          borderBottom="1px solid"
          borderColor="base.divider.strong"
          w="100%"
          alignItems="center"
        >
          <Icon as={BiText} color="blue.600" />
          <ChakraText pl="0.75rem" textStyle="h5" w="100%">
            Edit {PROSE_COMPONENT_NAME}
          </ChakraText>
          <IconButton
            size="lg"
            variant="clear"
            colorScheme="neutral"
            color="interaction.sub.default"
            aria-label="Close add component"
            icon={<BiX />}
            onClick={() => {
              setDrawerState({ state: "root" })
              setPreviewPageState(savedPageState)
            }}
          />
        </Flex>
        <Box w="100%" p="2rem" h="100%">
          <TiptapEditor data={content} handleChange={updatePageState} />
        </Box>
      </VStack>

      <Box
        pos="sticky"
        bottom={0}
        bgColor="base.canvas.default"
        boxShadow="md"
        py="1.5rem"
        px="2rem"
      >
        <HStack spacing="0.75rem">
          <IconButton
            icon={<BiTrash fontSize="1.25rem" />}
            variant="outline"
            colorScheme="critical"
            aria-label="Delete block"
            onClick={onDeleteBlockModalOpen}
          />
          <Box w="100%">
            <Button
              w="100%"
              onClick={() => {
                setDrawerState({ state: "root" })
                setSavedPageState(previewPageState)
              }}
            >
              Save changes
            </Button>
          </Box>
        </HStack>
      </Box>
    </>
  )
}

export default TipTapComponent
