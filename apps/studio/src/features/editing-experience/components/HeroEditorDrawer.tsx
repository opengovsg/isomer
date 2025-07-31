import type { IsomerComponent } from "@opengovsg/isomer-components"
import { useCallback, useEffect } from "react"
import { Box, Flex, useDisclosure } from "@chakra-ui/react"
import { Button, useToast } from "@opengovsg/design-system-react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import cloneDeep from "lodash/cloneDeep"
import isEmpty from "lodash/isEmpty"
import isEqual from "lodash/isEqual"

import type { ModifiedAsset } from "~/types/assets"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useUploadAssetMutation } from "~/hooks/useUploadAssetMutation"
import { ajv } from "~/utils/ajv"
import { trpc } from "~/utils/trpc"
import { pageSchema } from "../schema"
import {
  CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE,
  PLACEHOLDER_IMAGE_FILENAME,
} from "./constants"
import { DiscardChangesModal } from "./DiscardChangesModal"
import { DrawerHeader } from "./Drawer/DrawerHeader"
import { ErrorProvider, useBuilderErrors } from "./form-builder/ErrorProvider"
import FormBuilder from "./form-builder/FormBuilder"
import { uploadModifiedAssets } from "./utils"

export default function HeroEditorDrawer(): JSX.Element {
  const {
    isOpen: isDiscardChangesModalOpen,
    onOpen: onDiscardChangesModalOpen,
    onClose: onDiscardChangesModalClose,
  } = useDisclosure()
  const {
    setDrawerState,
    savedPageState,
    setSavedPageState,
    previewPageState,
    currActiveIdx,
    setPreviewPageState,
    modifiedAssets,
    setModifiedAssets,
  } = useEditorDrawerContext()
  const toast = useToast()

  const subSchema = getComponentSchema({ component: "hero" })
  const validateFn = ajv.compile<IsomerComponent>(subSchema)

  const { pageId, siteId } = useQueryParse(pageSchema)
  const utils = trpc.useUtils()

  const savePageMutation = trpc.page.updatePageBlob.useMutation()

  useEffect(() => {
    if (savePageMutation.isSuccess) {
      void utils.page.readPageAndBlob.invalidate({ pageId, siteId })
      void utils.page.readPage.invalidate({ pageId, siteId })
      toast({
        title: CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE,
        ...BRIEF_TOAST_SETTINGS,
      })
    }
  }, [
    savePageMutation.isSuccess,
    toast,
    utils.page.readPage,
    utils.page.readPageAndBlob,
    pageId,
    siteId,
  ])

  const { mutateAsync: uploadAsset, isPending: isUploadingAsset } =
    useUploadAssetMutation({ siteId, resourceId: String(pageId) })

  const deleteAssetsMutation = trpc.asset.deleteAssets.useMutation()

  const isLoading =
    savePageMutation.isPending ||
    isUploadingAsset ||
    deleteAssetsMutation.isPending

  const handleSaveChanges = useCallback(async () => {
    let newPageState = previewPageState

    if (modifiedAssets.length > 0) {
      const updatedBlocks = Array.from(previewPageState.content)
      const newBlock = cloneDeep(updatedBlocks[currActiveIdx])

      if (!newBlock) {
        return
      }

      const isUploadingSuccessful = await uploadModifiedAssets({
        block: newBlock,
        modifiedAssets,
        uploadAsset,
        onSuccess: (block: IsomerComponent) => {
          updatedBlocks[currActiveIdx] = block
          newPageState = {
            ...previewPageState,
            content: updatedBlocks,
          }
        },
        onError: (failedUploads: ModifiedAsset[]) => {
          const failedUploadsCount = failedUploads.length
          const totalUploadsCount = modifiedAssets.length

          toast({
            title: "Error uploading files/images",
            description: `An error occurred while uploading ${failedUploadsCount}/${totalUploadsCount} files/images. Please try again later.`,
            status: "error",
            ...BRIEF_TOAST_SETTINGS,
          })

          // NOTE: Do not save page if there are errors uploading assets
          setModifiedAssets(failedUploads)
          setPreviewPageState(newPageState)
        },
      })

      if (!isUploadingSuccessful) {
        return
      }

      // Delete the original assets for those that have been modified
      // This is done by deleting the file key stored in the src attribute, as
      // it would have been replaced by new file keys after uploading
      const assetsToDelete = modifiedAssets
        .map(({ src }) => src?.slice(1))
        .filter((src) => src !== PLACEHOLDER_IMAGE_FILENAME)
        .reduce<string[]>((acc, curr) => {
          if (curr !== undefined) {
            acc.push(curr)
          }
          return acc
        }, [])

      deleteAssetsMutation.mutate({
        siteId,
        resourceId: String(pageId),
        fileKeys: assetsToDelete,
      })
    }

    savePageMutation.mutate(
      {
        pageId,
        siteId,
        content: JSON.stringify(newPageState),
      },
      {
        onSuccess: () => {
          setModifiedAssets([])
          setPreviewPageState(newPageState)
          setSavedPageState(newPageState)
          setDrawerState({ state: "root" })
        },
      },
    )
  }, [
    currActiveIdx,
    deleteAssetsMutation,
    modifiedAssets,
    savePageMutation,
    pageId,
    previewPageState,
    setDrawerState,
    setModifiedAssets,
    setPreviewPageState,
    setSavedPageState,
    siteId,
    toast,
    uploadAsset,
  ])

  const handleDiscardChanges = useCallback(() => {
    setPreviewPageState(savedPageState)
    onDiscardChangesModalClose()
    setDrawerState({ state: "root" })
  }, [
    onDiscardChangesModalClose,
    savedPageState,
    setDrawerState,
    setPreviewPageState,
  ])

  const handleChange = useCallback(
    (data: IsomerComponent) => {
      const updatedBlocks = Array.from(previewPageState.content)
      updatedBlocks[currActiveIdx] = data
      const newPageState = {
        ...previewPageState,
        content: updatedBlocks,
      }
      setPreviewPageState(newPageState)
    },
    [currActiveIdx, previewPageState, setPreviewPageState],
  )

  return (
    <>
      <DiscardChangesModal
        isOpen={isDiscardChangesModalOpen}
        onClose={onDiscardChangesModalClose}
        onDiscard={handleDiscardChanges}
      />

      <Flex flexDir="column" position="relative" h="100%" w="100%">
        <DrawerHeader
          isDisabled={isLoading}
          onBackClick={() => {
            if (!isEqual(previewPageState, savedPageState)) {
              onDiscardChangesModalOpen()
            } else {
              handleDiscardChanges()
            }
          }}
          label="Edit Hero banner"
        />

        <ErrorProvider>
          <Box px="1.5rem" py="1rem" flex={1} overflow="auto">
            <Box mb="1rem">
              <FormBuilder<IsomerComponent>
                schema={subSchema}
                validateFn={validateFn}
                data={previewPageState.content[0]}
                handleChange={handleChange}
              />
            </Box>
          </Box>
          <Box
            bgColor="base.canvas.default"
            boxShadow="md"
            py="1.5rem"
            px="2rem"
          >
            <SaveButton onClick={handleSaveChanges} isLoading={isLoading} />
          </Box>
        </ErrorProvider>
      </Flex>
    </>
  )
}

const SaveButton = ({
  onClick,
  isLoading,
}: {
  onClick: () => void
  isLoading: boolean
}) => {
  const { errors } = useBuilderErrors()

  return (
    <Button
      w="100%"
      isLoading={isLoading}
      isDisabled={!isEmpty(errors)}
      onClick={onClick}
    >
      Save changes
    </Button>
  )
}
