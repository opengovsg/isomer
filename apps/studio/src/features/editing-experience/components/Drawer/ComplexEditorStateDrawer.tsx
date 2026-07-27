import type { IsomerComponent } from "@opengovsg/isomer-components"
import type { ModifiedAsset } from "~/types/assets"
import { Box, Flex, HStack, useDisclosure } from "@chakra-ui/react"
import { Button, IconButton, useToast } from "@opengovsg/design-system-react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { cloneDeep, isEmpty, isEqual } from "lodash-es"
import { useCallback, useMemo } from "react"
import { BiTrash } from "react-icons/bi"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { useUploadAssetMutation } from "~/hooks/useUploadAssetMutation"
import { ajv } from "~/utils/ajv"
import { trpc } from "~/utils/trpc"
import { ResourceType } from "~prisma/generated/generatedEnums"

import { pageSchema } from "../../schema"
import {
  CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE,
  PLACEHOLDER_IMAGE_FILENAME,
} from "../constants"
import { DeleteBlockModal } from "../DeleteBlockModal"
import { DiscardChangesModal } from "../DiscardChangesModal"
import { ErrorProvider, useBuilderErrors } from "../form-builder/ErrorProvider"
import FormBuilder from "../form-builder/FormBuilder"
import { uploadModifiedAssets } from "../utils"
import { DrawerHeader } from "./DrawerHeader"

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
    type,
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

  const { pageId, siteId } = useQueryParse(pageSchema)
  const utils = trpc.useUtils()

  const { mutate: savePage, isPending: isSavingPage } =
    trpc.page.updatePageBlob.useMutation({
      onSuccess: async () => {
        await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
        await utils.page.readPage.invalidate({ pageId, siteId })
        if (type === ResourceType.CollectionPage) {
          void utils.collection.countTagOptionsUsage.invalidate()
        }
        toast({
          status: "success",
          title: CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE,
          ...BRIEF_TOAST_SETTINGS,
        })
      },
    })

  const { mutateAsync: uploadAsset, isPending: isUploadingAsset } =
    useUploadAssetMutation({ siteId, resourceId: String(pageId) })
  const { mutate: deleteAssets, isPending: isDeletingAssets } =
    trpc.asset.deleteAssets.useMutation()

  const handleDeleteBlock = useCallback(() => {
    const currentBlock = savedPageState.content[currActiveIdx]
    const updatedBlocks = Array.from(savedPageState.content)

    // For childrenpages blocks, hide instead of delete
    if (currentBlock?.type === "childrenpages") {
      updatedBlocks[currActiveIdx] = {
        ...currentBlock,
        isHidden: true,
      }
    } else {
      updatedBlocks.splice(currActiveIdx, 1)
    }

    const newPageState = {
      ...previewPageState,
      content: updatedBlocks,
    }
    onDeleteBlockModalClose()
    setDrawerState({ state: "root" })
    setAddedBlockIndex(null)
    savePage({
      pageId,
      siteId,
      content: JSON.stringify(newPageState),
    })
    // NOTE: This chunk needs to be AFTER `setDrawerState`.
    // This is because we set the state of the drawer and then
    // use `flushSync` to force a re-render.
    // As this state is also read by `FormBuilder`,
    // setting the state here will lead to a crash
    // as the component will then re-render with an invalid
    // state being fed to `FormBuilder`.
    setSavedPageState(newPageState)
    setPreviewPageState(newPageState)
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
      setPreviewPageState((oldPageState) => {
        const updatedBlocks = Array.from(oldPageState.content)
        updatedBlocks[currActiveIdx] = data

        const newPageState = {
          ...oldPageState,
          content: updatedBlocks,
        }
        return newPageState
      })
    },
    [currActiveIdx, setPreviewPageState],
  )

  const handleSave = useCallback(async () => {
    let newPageState = previewPageState

    let assetsToDelete: string[] = []

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

      // Collect the original asset keys so they can be deleted after the page
      // save succeeds.
      assetsToDelete = modifiedAssets.reduce<string[]>((acc, { src }) => {
        const fileKey = src?.slice(1)
        if (fileKey !== undefined && fileKey !== PLACEHOLDER_IMAGE_FILENAME) {
          acc.push(fileKey)
        }
        return acc
      }, [])
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
          setPreviewPageState(newPageState)
          setSavedPageState(newPageState)
          setDrawerState({ state: "root" })
          setAddedBlockIndex(null)
          if (assetsToDelete.length > 0) {
            deleteAssets({
              siteId,
              resourceId: String(pageId),
              fileKeys: assetsToDelete,
            })
          }
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

  const component = previewPageState.content[currActiveIdx]
  const componentType = component?.type
  const pageLayout = previewPageState.layout
  // NOTE: Memoised so the schema identity is stable across renders.
  // getComponentSchema returns a fresh object per call; passing a new schema
  // to JsonForms on every render makes its internal resync effect fire on each
  // parent re-render, replacing in-progress form state with the (stale) data
  // prop. Async writes (e.g. uploaded image src, which arrives ~10ms later via
  // JsonForms' debounced onChange) get silently erased before reaching us.
  const { subSchema, validateFn } = useMemo(() => {
    if (!componentType) return { subSchema: undefined, validateFn: undefined }
    const schema = getComponentSchema({
      component: componentType,
      layout: pageLayout,
    })
    return {
      subSchema: schema,
      validateFn: ajv.compile<IsomerComponent>(schema),
    }
  }, [componentType, pageLayout])

  if (currActiveIdx === -1 || currActiveIdx > previewPageState.content.length) {
    return <></>
  }

  if (!component || !subSchema || !validateFn) {
    return <></>
  }

  const componentName = subSchema.title || "component"

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
            <Box mb="1rem">
              <FormBuilder<IsomerComponent>
                schema={subSchema}
                validateFn={validateFn}
                data={component}
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
            <HStack spacing="0.75rem">
              <IconButton
                icon={<BiTrash fontSize="1.25rem" />}
                variant="outline"
                colorScheme="critical"
                aria-label="Delete block"
                onClick={onDeleteBlockModalOpen}
              />
              <Box w="100%">
                <SaveButton
                  onClick={handleSave}
                  isLoading={isLoading}
                  isNonEditableBlock={
                    component.type === "antiscambanner" &&
                    // Exclude the "just added this block" case so Save can persist the insert (discard would remove it).
                    !(
                      addedBlockIndex !== null &&
                      addedBlockIndex === currActiveIdx
                    )
                  }
                />
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
  isNonEditableBlock,
}: {
  onClick: () => void
  isLoading: boolean
  isNonEditableBlock: boolean
}) => {
  const { errors } = useBuilderErrors()

  return (
    <Button
      w="100%"
      isLoading={isLoading}
      isDisabled={isNonEditableBlock || !isEmpty(errors)}
      onClick={onClick}
    >
      Save block
    </Button>
  )
}
