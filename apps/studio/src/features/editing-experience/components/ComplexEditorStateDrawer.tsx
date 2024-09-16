import type { IsomerComponent } from "@opengovsg/isomer-components"
import { useCallback } from "react"
import { Box, Flex, HStack, useDisclosure } from "@chakra-ui/react"
import { Button, IconButton, useToast } from "@opengovsg/design-system-react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import Ajv from "ajv"
import cloneDeep from "lodash/cloneDeep"
import isEmpty from "lodash/isEmpty"
import isEqual from "lodash/isEqual"
import set from "lodash/set"
import { BiTrash } from "react-icons/bi"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useUploadAssetMutation } from "~/hooks/useUploadAssetMutation"
import { trpc } from "~/utils/trpc"
import { editPageSchema } from "../schema"
import { BRIEF_TOAST_SETTINGS, PLACEHOLDER_IMAGE_FILENAME } from "./constants"
import { DeleteBlockModal } from "./DeleteBlockModal"
import { DiscardChangesModal } from "./DiscardChangesModal"
import { DrawerHeader } from "./Drawer/DrawerHeader"
import { ErrorProvider, useBuilderErrors } from "./form-builder/ErrorProvider"
import FormBuilder from "./form-builder/FormBuilder"

const ajv = new Ajv({ strict: false, logger: false })

export default function ComplexEditorStateDrawer(): JSX.Element {
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
    addedBlockIndex,
    setAddedBlockIndex,
    setDrawerState,
    currActiveIdx,
    savedPageState,
    setSavedPageState,
    previewPageState,
    setPreviewPageState,
    modifiedAssets,
    setModifiedAssets,
  } = useEditorDrawerContext()
  const toast = useToast()

  const { pageId, siteId } = useQueryParse(editPageSchema)
  const utils = trpc.useUtils()

  const { mutate: savePage, isLoading: isSavingPage } =
    trpc.page.updatePageBlob.useMutation({
      onSuccess: async () => {
        await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
        toast({ title: "Changes saved", ...BRIEF_TOAST_SETTINGS })
      },
    })

  const { mutateAsync: uploadAsset, isLoading: isUploadingAsset } =
    useUploadAssetMutation({ siteId })
  const { mutate: deleteAssets, isLoading: isDeletingAssets } =
    trpc.asset.deleteAssets.useMutation()

  const handleDeleteBlock = useCallback(() => {
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
    savePage({
      pageId,
      siteId,
      content: JSON.stringify(newPageState),
    })
  }, [
    currActiveIdx,
    onDeleteBlockModalClose,
    pageId,
    previewPageState,
    savePage,
    savedPageState.content,
    setAddedBlockIndex,
    setDrawerState,
    setPreviewPageState,
    setSavedPageState,
    siteId,
  ])

  const handleDiscardChanges = useCallback(() => {
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
  }, [
    addedBlockIndex,
    onDiscardChangesModalClose,
    previewPageState,
    savedPageState,
    setAddedBlockIndex,
    setDrawerState,
    setPreviewPageState,
    setSavedPageState,
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

  const handleSave = useCallback(async () => {
    let newPageState = previewPageState

    if (modifiedAssets.length > 0) {
      const updatedBlocks = Array.from(previewPageState.content)
      const newBlock = cloneDeep(updatedBlocks[currActiveIdx])

      if (!newBlock) {
        return
      }

      // Upload all new/modified images/files
      const assetsToUpload = modifiedAssets.filter(
        (asset) =>
          !!asset.file && asset.file.name !== PLACEHOLDER_IMAGE_FILENAME,
      )

      // Delete the original assets for those that have been modified
      // This is done by deleting the file key stored in the src attribute, as
      // it would have been replaced by new file keys after uploading
      const assetsToDelete = modifiedAssets
        .map(({ src }) => src)
        .reduce<string[]>((acc, curr) => {
          if (curr !== undefined) {
            acc.push(curr)
          }
          return acc
        }, [])

      const isUploadingSuccessful = await Promise.allSettled(
        assetsToUpload.map(({ path, file }) => {
          if (!file) {
            return
          }

          return uploadAsset({ file }).then((res) => {
            set(newBlock, path, res.path)
            return path
          })
        }),
      ).then((results) => {
        // Keep only failed uploads inside modifiedAssets so on subsequent
        // save attempts, we retry uploading just the failed assets
        const newModifiedAssets = modifiedAssets
          .filter(
            ({ file }) => !!file && file.name !== PLACEHOLDER_IMAGE_FILENAME,
          )
          .filter(({ path }) => {
            return !results.some(
              (result) =>
                result.status === "fulfilled" && result.value === path,
            )
          })

        if (newModifiedAssets.length > 0) {
          const failedUploadsCount = newModifiedAssets.length
          const totalUploadsCount = modifiedAssets.length

          toast({
            title: "Error uploading files/images",
            description: `An error occurred while uploading ${failedUploadsCount}/${totalUploadsCount} files/images. Please try again later.`,
            status: "error",
          })

          setModifiedAssets(newModifiedAssets)
          return false
        }

        return true
      })

      if (!isUploadingSuccessful) {
        // NOTE: Do not save page if there are errors uploading assets
        setPreviewPageState(newPageState)
        return
      }

      deleteAssets({ fileKeys: assetsToDelete })

      updatedBlocks[currActiveIdx] = newBlock
      newPageState = {
        ...previewPageState,
        content: updatedBlocks,
      }
    }

    savePage(
      {
        pageId,
        siteId,
        content: JSON.stringify(newPageState),
      },
      {
        onSuccess: () => {
          setModifiedAssets([])
          setSavedPageState(newPageState)
          setDrawerState({ state: "root" })
          setAddedBlockIndex(null)
        },
      },
    )
  }, [
    currActiveIdx,
    deleteAssets,
    modifiedAssets,
    pageId,
    previewPageState,
    savePage,
    setAddedBlockIndex,
    setDrawerState,
    setModifiedAssets,
    setPreviewPageState,
    setSavedPageState,
    siteId,
    toast,
    uploadAsset,
  ])

  const isLoading = isSavingPage || isUploadingAsset || isDeletingAssets

  if (currActiveIdx === -1 || currActiveIdx > previewPageState.content.length) {
    return <></>
  }

  const component = previewPageState.content[currActiveIdx]

  if (!component) {
    return <></>
  }

  const subSchema = getComponentSchema(component.type)
  const { title } = subSchema
  const validateFn = ajv.compile<IsomerComponent>(subSchema)
  const componentName = title || "component"

  return (
    <>
      <DeleteBlockModal
        itemName={componentName}
        isOpen={isDeleteBlockModalOpen}
        onClose={onDeleteBlockModalClose}
        onDelete={handleDeleteBlock}
      />

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
          label={`Edit ${componentName}`}
        />
        <ErrorProvider>
          <Box flex={1} overflow="auto" px="1.5rem" py="1rem">
            <FormBuilder<IsomerComponent>
              schema={subSchema}
              validateFn={validateFn}
              data={component}
              handleChange={handleChange}
            />
          </Box>
          <Box
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
                <SaveButton onClick={handleSave} isLoading={isLoading} />
              </Box>
            </HStack>
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
      Save block
    </Button>
  )
}
