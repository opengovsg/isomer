import type { IsomerComponent } from "@opengovsg/isomer-components"
import { Box, Flex, HStack, useDisclosure } from "@chakra-ui/react"
import { Button, IconButton, useToast } from "@opengovsg/design-system-react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import Ajv from "ajv"
import cloneDeep from "lodash/cloneDeep"
import isEqual from "lodash/isEqual"
import set from "lodash/set"
import { BiTrash } from "react-icons/bi"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useUploadAssetMutation } from "~/hooks/useUploadAssetMutation"
import { trpc } from "~/utils/trpc"
import { editPageSchema } from "../schema"
import { BRIEF_TOAST_SETTINGS } from "./constants"
import { DeleteBlockModal } from "./DeleteBlockModal"
import { DiscardChangesModal } from "./DiscardChangesModal"
import { DrawerHeader } from "./Drawer/DrawerHeader"
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
    savePage({
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

  const handleChange = (data: IsomerComponent) => {
    const updatedBlocks = Array.from(previewPageState.content)
    updatedBlocks[currActiveIdx] = data
    const newPageState = {
      ...previewPageState,
      content: updatedBlocks,
    }
    setPreviewPageState(newPageState)
  }

  const handleSave = async () => {
    let newPageState = previewPageState

    if (modifiedAssets.length > 0) {
      const updatedBlocks = Array.from(previewPageState.content)
      const newBlock = cloneDeep(updatedBlocks[currActiveIdx])

      if (!newBlock) {
        return
      }

      // Upload all new/modified images/files
      const assetsToUpload = modifiedAssets.filter((asset) => !!asset.file)

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
        const newModifiedAssets = modifiedAssets.filter(({ path }) => {
          return !results.some(
            (result) => result.status === "fulfilled" && result.value === path,
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
  }

  const isLoading = isSavingPage || isUploadingAsset || isDeletingAssets

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
        <Box flex={1} overflow="auto" px="2rem" py="1rem">
          <FormBuilder<IsomerComponent>
            schema={subSchema}
            validateFn={validateFn}
            data={component}
            handleChange={handleChange}
          />
        </Box>
        <Box bgColor="base.canvas.default" boxShadow="md" py="1.5rem" px="2rem">
          <HStack spacing="0.75rem">
            <IconButton
              icon={<BiTrash fontSize="1.25rem" />}
              variant="outline"
              colorScheme="critical"
              aria-label="Delete block"
              onClick={onDeleteBlockModalOpen}
            />
            <Box w="100%">
              <Button w="100%" onClick={handleSave} isLoading={isLoading}>
                Save changes
              </Button>
            </Box>
          </HStack>
        </Box>
      </Flex>
    </>
  )
}
