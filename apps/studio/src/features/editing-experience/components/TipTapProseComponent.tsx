import type { ProseProps } from "@opengovsg/isomer-components"
import type { JSONContent } from "@tiptap/react"
import { useEffect } from "react"
import { Box, HStack, useDisclosure, VStack } from "@chakra-ui/react"
import { Button, IconButton, useToast } from "@opengovsg/design-system-react"
import isEqual from "lodash/isEqual"
import { BiTrash } from "react-icons/bi"

import { PROSE_COMPONENT_NAME } from "~/constants/formBuilder"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { useTextEditor } from "../hooks/useTextEditor"
import { pageSchema } from "../schema"
import { CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE } from "./constants"
import { DeleteBlockModal } from "./DeleteBlockModal"
import { DiscardChangesModal } from "./DiscardChangesModal"
import { DrawerHeader } from "./Drawer/DrawerHeader"
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

  const toast = useToast()
  const utils = trpc.useUtils()
  const { pageId, siteId } = useQueryParse(pageSchema)

  const updatePageBlobMutation = trpc.page.updatePageBlob.useMutation()

  useEffect(() => {
    if (updatePageBlobMutation.isSuccess) {
      void utils.page.readPageAndBlob.invalidate({ pageId, siteId })
      void utils.page.readPage.invalidate({ pageId, siteId })
      toast({
        title: CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE,
        ...BRIEF_TOAST_SETTINGS,
      })
    }
  }, [updatePageBlobMutation.isSuccess, utils, toast, pageId, siteId])

  const updatePageState = (editorContent: JSONContent | undefined) => {
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

  const handleDeleteBlock = () => {
    const updatedBlocks = Array.from(savedPageState.content)
    updatedBlocks.splice(currActiveIdx, 1)
    const newPageState = {
      ...previewPageState,
      content: updatedBlocks,
    }
    // NOTE: We need to reset the drawer state before mutating the page state,
    // as the mutation will cause the active index to point to an incorrect
    // block, which causes the editor to crash
    setDrawerState({ state: "root" })
    setSavedPageState(newPageState)
    setPreviewPageState(newPageState)
    onDeleteBlockModalClose()
    setAddedBlockIndex(null)
    updatePageBlobMutation.mutate({
      pageId,
      siteId,
      content: JSON.stringify(newPageState),
    })
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
        <DrawerHeader
          isDisabled={updatePageBlobMutation.isPending}
          onBackClick={() => {
            if (!isEqual(previewPageState, savedPageState)) {
              onDiscardChangesModalOpen()
            } else {
              handleDiscardChanges()
            }
          }}
          label={`Edit ${PROSE_COMPONENT_NAME}`}
        />
        <Box w="100%" overflow="auto" flex={1}>
          <TiptapTextEditor editor={editor} />
        </Box>
        <Box
          bgColor="base.canvas.default"
          boxShadow="md"
          py="1.5rem"
          px="2rem"
          w="full"
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
                  updatePageBlobMutation.mutate(
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
                isLoading={updatePageBlobMutation.isPending}
              >
                Save changes
              </Button>
            </Box>
          </HStack>
        </Box>
      </VStack>
    </>
  )
}

export default TipTapProseComponent
