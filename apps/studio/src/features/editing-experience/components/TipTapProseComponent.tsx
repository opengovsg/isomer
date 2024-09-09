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
import { ProseProps } from "@opengovsg/isomer-components"
import _ from "lodash"
import { BiText, BiTrash, BiX } from "react-icons/bi"

import { PROSE_COMPONENT_NAME } from "~/constants/formBuilder"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { useTextEditor } from "../hooks/useTextEditor"
import { editPageSchema } from "../schema"
import { DeleteBlockModal } from "./DeleteBlockModal"
import { DiscardChangesModal } from "./DiscardChangesModal"
import { TiptapTextEditor } from "./form-builder/renderers/TipTapEditor"

interface TipTapComponentProps {
  content: ProseProps
}

function TipTapProseComponent({ content }: TipTapComponentProps) {
  const {
    isOpen: isDeleteBlockModalOpen,
    onOpen: onDeleteBlockModalOpen,
    onClose: onDeleteBlockModalClose,
  } = useDisclosure()
  const {
    isOpen: isDiscardChangesModalOpen,
    onOpen: onDiscardChangesModalOpen,
    onClose: onDiscardChangesModalClose,
  } = useDisclosure()
  const {
    savedPageState,
    setDrawerState,
    setSavedPageState,
    previewPageState,
    setPreviewPageState,
    currActiveIdx,
    addedBlockIndex,
    setAddedBlockIndex,
  } = useEditorDrawerContext()

  const { pageId, siteId } = useQueryParse(editPageSchema)
  const { mutate, isLoading } = trpc.page.updatePageBlob.useMutation({
    onSuccess: async () => {
      await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
    },
  })

  const updatePageState = (editorContent: JSONContent) => {
    if (!previewPageState) return

    const updatedBlocks = Array.from(previewPageState.content)
    // TODO: actual validation
    updatedBlocks[currActiveIdx] = editorContent as ProseProps
    const newPageState = {
      ...previewPageState,
      content: updatedBlocks,
    }
    setPreviewPageState(newPageState)
  }

  const editor = useTextEditor({ data: content, handleChange: updatePageState })

  if (!previewPageState || !savedPageState) return

  const handleDeleteBlock = () => {
    const updatedBlocks = Array.from(savedPageState.content)
    updatedBlocks.splice(currActiveIdx, 1)
    const newPageState = {
      ...previewPageState,
      content: updatedBlocks,
    }
    setSavedPageState(newPageState)
    setPreviewPageState(newPageState)
    onDeleteBlockModalClose()
    setDrawerState({ state: "root" })
    setAddedBlockIndex(null)
  }

  const handleDiscardChanges = () => {
    if (addedBlockIndex !== null) {
      const updatedBlocks = Array.from(savedPageState.content)
      updatedBlocks.splice(addedBlockIndex, 1)
      const newPageState = {
        ...previewPageState,
        content: updatedBlocks,
      }
      setSavedPageState(newPageState)
      setPreviewPageState(newPageState)
    } else {
      setPreviewPageState(savedPageState)
    }
    setAddedBlockIndex(null)
    onDiscardChangesModalClose()
    setDrawerState({ state: "root" })
  }

  const utils = trpc.useUtils()

  // TODO: Add a loading state or use suspense
  return (
    <>
      <DeleteBlockModal
        itemName={PROSE_COMPONENT_NAME}
        isOpen={isDeleteBlockModalOpen}
        onClose={onDeleteBlockModalClose}
        onDelete={handleDeleteBlock}
      />

      <DiscardChangesModal
        isOpen={isDiscardChangesModalOpen}
        onClose={onDiscardChangesModalClose}
        onDiscard={handleDiscardChanges}
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
            aria-label="Close drawer"
            isDisabled={isLoading}
            icon={<BiX />}
            onClick={() => {
              if (!_.isEqual(previewPageState, savedPageState)) {
                onDiscardChangesModalOpen()
              } else {
                handleDiscardChanges()
              }
            }}
          />
        </Flex>
        <Box w="100%" p="2rem" h="100%">
          <TiptapTextEditor editor={editor} />
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
                setSavedPageState(previewPageState)
                mutate(
                  {
                    pageId,
                    siteId,
                    content: JSON.stringify(previewPageState),
                  },
                  {
                    onSuccess: () => {
                      setAddedBlockIndex(null)
                      setDrawerState({ state: "root" })
                    },
                  },
                )
              }}
              isLoading={isLoading}
            >
              Save changes
            </Button>
          </Box>
        </HStack>
      </Box>
    </>
  )
}

export default TipTapProseComponent
