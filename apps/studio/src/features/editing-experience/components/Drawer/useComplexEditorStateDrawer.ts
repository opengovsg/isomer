import type { IsomerComponent } from "@opengovsg/isomer-components"
import type { ModifiedAsset } from "~/types/assets"
import { useDisclosure } from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { cloneDeep, isEqual } from "lodash-es"
import posthog from "posthog-js"
import { useCallback, useMemo } from "react"
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
import { uploadModifiedAssets } from "../utils"

export const useComplexEditorStateDrawer = () => {
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
        posthog.capture("page_changes_saved", { site_id: siteId })
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
    useUploadAssetMutation({ resourceId: String(pageId), siteId })
  const { mutate: deleteAssets, isPending: isDeletingAssets } =
    trpc.asset.deleteAssets.useMutation()

  const handleDeleteBlock = useCallback(() => {
    const currentBlock = savedPageState.content[currActiveIdx]
    const updatedBlocks = [...savedPageState.content]

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
      content: JSON.stringify(newPageState),
      pageId,
      siteId,
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
    if (addedBlockIndex === null) {
      setPreviewPageState(savedPageState)
    } else {
      const updatedBlocks = [...savedPageState.content]
      updatedBlocks.splice(addedBlockIndex, 1)
      const newPageState = {
        ...previewPageState,
        content: updatedBlocks,
      }
      setSavedPageState(newPageState)
      setPreviewPageState(newPageState)
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
        const updatedBlocks = [...oldPageState.content]
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
      const updatedBlocks = [...previewPageState.content]
      const newBlock = cloneDeep(updatedBlocks[currActiveIdx])

      if (!newBlock) {
        return
      }

      const isUploadingSuccessful = await uploadModifiedAssets({
        block: newBlock,
        modifiedAssets,
        onError: (failedUploads: ModifiedAsset[]) => {
          const failedUploadsCount = failedUploads.length
          const totalUploadsCount = modifiedAssets.length

          toast({
            description: `An error occurred while uploading ${failedUploadsCount}/${totalUploadsCount} files/images. Please try again later.`,
            status: "error",
            title: "Error uploading files/images",
            ...BRIEF_TOAST_SETTINGS,
          })

          setModifiedAssets(failedUploads)
          setPreviewPageState(newPageState)
        },
        onSuccess: (block: IsomerComponent) => {
          updatedBlocks[currActiveIdx] = block
          newPageState = {
            ...previewPageState,
            content: updatedBlocks,
          }
        },
        uploadAsset,
      })

      if (!isUploadingSuccessful) {
        return
      }

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
        content: JSON.stringify(newPageState),
        pageId,
        siteId,
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
              fileKeys: assetsToDelete,
              resourceId: String(pageId),
              siteId,
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

  const handleBackClick = useCallback(() => {
    if (isEqual(previewPageState, savedPageState)) {
      handleDiscardChanges()
    } else {
      onDiscardChangesModalOpen()
    }
  }, [
    handleDiscardChanges,
    onDiscardChangesModalOpen,
    previewPageState,
    savedPageState,
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
    if (!componentType) {
      return { subSchema: undefined, validateFn: undefined }
    }
    const schema = getComponentSchema({
      component: componentType,
      layout: pageLayout,
    })
    return {
      subSchema: schema,
      validateFn: ajv.compile<IsomerComponent>(schema),
    }
  }, [componentType, pageLayout])

  const isNonEditableBlock =
    component?.type === "antiscambanner" &&
    !(addedBlockIndex !== null && addedBlockIndex === currActiveIdx)

  const componentName = subSchema?.title || "component"

  const isInvalidIndex =
    currActiveIdx === -1 || currActiveIdx > previewPageState.content.length

  return {
    component,
    componentName,
    handleBackClick,
    handleChange,
    handleDeleteBlock,
    handleDiscardChanges,
    handleSave,
    isInvalidIndex,
    modalState: {
      isDeleteBlockModalOpen,
      isDiscardChangesModalOpen,
    },
    onDeleteBlockModalClose,
    onDeleteBlockModalOpen,
    onDiscardChangesModalClose,
    subSchema,
    uiState: {
      isLoading,
      isNonEditableBlock,
    },
    validateFn,
  }
}
