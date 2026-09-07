import type { DropResult } from "@hello-pangea/dnd"
import type { IsomerSchema } from "@opengovsg/isomer-components"
import { Flex, Text, useDisclosure, VStack } from "@chakra-ui/react"
import { useToast } from "@opengovsg/design-system-react"
import {
  ISOMER_USABLE_PAGE_LAYOUTS,
  schema,
} from "@opengovsg/isomer-components"
import posthog from "posthog-js"
import { useCallback, useState } from "react"
import { Disable } from "~/components/Disable"
import { DEFAULT_BLOCKS } from "~/components/PageEditor/constants"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { useNewCollectionTagsManagement } from "~/hooks/useNewCollectionTagsManagement"
import { useQueryParse } from "~/hooks/useQueryParse"
import { ajv } from "~/utils/ajv"
import { trpc } from "~/utils/trpc"
import { IsomerAdminRole, ResourceType } from "~prisma/generated/generatedEnums"

import { pageSchema } from "../../schema"
import { ActivateRawJsonEditorMode } from "../ActivateRawJsonEditorMode"
import { ConfirmConvertIndexPageModal } from "../ConfirmConvertIndexPageModal"
import { CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE } from "../constants"
import {
  RootStateDrawerAlerts,
  RootStateDrawerBlocksSection,
  RootStateDrawerPreviewFooter,
} from "./RootStateDrawerDraggableBlocks"
import { FixedBlock } from "./RootStateDrawerFixedBlock"

const validateFn = ajv.compile<IsomerSchema>(schema)

const RootStateDrawer = () => {
  const {
    type,
    setDrawerState,
    savedPageState,
    setSavedPageState,
    previewPageState,
    setPreviewPageState,
  } = useEditorDrawerContext()
  const [isPreviewingIndexPage, setIsPreviewingIndexPage] = useState(false)
  const {
    isOpen: isConfirmConvertIndexPageModalOpen,
    onOpen: onConfirmConvertIndexPageModalOpen,
    onClose: onConfirmConvertIndexPageModalClose,
  } = useDisclosure()
  const { pageId, siteId } = useQueryParse(pageSchema)
  const [{ scheduledAt }] = trpc.page.readPage.useSuspenseQuery({
    pageId,
    siteId,
  })
  const disableBlocks = isPreviewingIndexPage || !!scheduledAt
  const utils = trpc.useUtils()
  const { isAdmin: isUserIsomerAdmin } = useIsUserIsomerAdmin({
    roles: [IsomerAdminRole.Core, IsomerAdminRole.Migrator],
  })
  const toast = useToast()
  const { mutate } = trpc.page.reorderBlock.useMutation({
    onError: (error, variables) => {
      // NOTE: rollback to last known good state
      // @ts-expect-error Our zod validator runs between frontend and backend
      // and the error type is automatically inferred from the zod validator.
      // However, the type that we use on `pageState` is the full type
      // because `Preview` (amongst other things) requires the other properties on the actual schema type
      setPreviewPageState((prevPreview) => ({
        ...prevPreview,
        content: variables.blocks,
      }))
      // @ts-expect-error See above
      setSavedPageState((prevSavedPageState) => ({
        ...prevSavedPageState,
        content: variables.blocks,
      }))
      toast({
        description: error.message,
        status: "error",
        title: "Failed to update blocks",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
    onSuccess: async () => {
      await utils.page.readPage.invalidate({ pageId, siteId })
    },
  })

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

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) {
        return
      }

      const from = result.source.index
      const to = result.destination.index
      const contentLength = savedPageState.content.length

      if (from >= contentLength || to >= contentLength || from < 0 || to < 0) {
        return
      }

      // NOTE: We eagerly update their page state here
      // and if it fails on the backend,
      // we rollback to what we passed them
      const updatedBlocks = [...savedPageState.content]
      const [movedBlock] = updatedBlocks.splice(from, 1)

      if (!!movedBlock) {
        updatedBlocks.splice(to, 0, movedBlock)
        const newPageState = {
          ...savedPageState,
          content: updatedBlocks,
        }
        setPreviewPageState(newPageState)
        setSavedPageState(newPageState)
      }

      // NOTE: drive an update to the db with the updated index
      mutate({ blocks: savedPageState.content, from, pageId, siteId, to })
    },
    [
      mutate,
      pageId,
      savedPageState,
      setPreviewPageState,
      setSavedPageState,
      siteId,
    ],
  )

  const handleConversionToIndexPage = useCallback(() => {
    const newPageState = {
      ...savedPageState,
    }
    // NOTE: This layout needs to be outside, otherwise it is treated as a
    // string type rather than the array of layout consts
    newPageState.layout = "index"
    newPageState.content = [
      ...savedPageState.content,
      DEFAULT_BLOCKS.childrenpages,
    ]
    setPreviewPageState(newPageState)
    setIsPreviewingIndexPage(true)
  }, [savedPageState, setPreviewPageState])

  const handleCancelConversionToIndexPage = useCallback(() => {
    setIsPreviewingIndexPage(false)
    setPreviewPageState(savedPageState)
  }, [savedPageState, setPreviewPageState])

  const handleSaveConversionToIndexPage = useCallback(() => {
    savePage(
      {
        content: JSON.stringify(previewPageState),
        pageId,
        siteId,
      },
      {
        onSuccess: () => {
          setIsPreviewingIndexPage(false)
          setSavedPageState(previewPageState)
          onConfirmConvertIndexPageModalClose()
          setDrawerState({ state: "root" })
        },
      },
    )
  }, [
    onConfirmConvertIndexPageModalClose,
    pageId,
    previewPageState,
    savePage,
    setDrawerState,
    setSavedPageState,
    siteId,
  ])

  const pageLayout = previewPageState.layout

  const isCustomContentIndexPage =
    type === ResourceType.IndexPage &&
    pageLayout !== "index" &&
    pageLayout !== "collection"

  validateFn(savedPageState)

  const contentIndexRegex = /^\/content\/(\d+)/u
  const invalidBlockIndexes = new Set(
    (validateFn.errors ?? []).reduce<number[]>((indexes, error) => {
      const match = contentIndexRegex.exec(error.instancePath)?.[1]
      if (match) {
        indexes.push(Number(match))
      }
      return indexes
    }, []),
  )

  const isNewCollectionTagsManagementEnabled = useNewCollectionTagsManagement()

  return (
    <Flex direction="column" h="full">
      <ConfirmConvertIndexPageModal
        isOpen={isConfirmConvertIndexPageModalOpen}
        onClose={onConfirmConvertIndexPageModalClose}
        onProceed={handleSaveConversionToIndexPage}
      />

      <VStack gap="1.5rem" p="1.5rem" flex={1}>
        {isUserIsomerAdmin && (
          <ActivateRawJsonEditorMode
            onActivate={() => {
              setDrawerState({ state: "rawJsonEditor" })
            }}
          />
        )}

        <VStack w="100%" h="100%" gap="1rem">
          <RootStateDrawerAlerts
            isCustomContentIndexPage={isCustomContentIndexPage}
            scheduledAt={scheduledAt}
            isPreviewingIndexPage={isPreviewingIndexPage}
            onPreviewConversionToIndexPage={handleConversionToIndexPage}
          />

          {pageLayout === ISOMER_USABLE_PAGE_LAYOUTS.Collection &&
          isNewCollectionTagsManagementEnabled ? (
            // New collection editing UI introduced in https://github.com/opengovsg/isomer/pull/2002
            <Disable when={disableBlocks}>
              <VStack gap="1rem" w="100%" align="start">
                <VStack gap="0.25rem" align="start">
                  <Text textStyle="subhead-1">
                    {pageLayout === ISOMER_USABLE_PAGE_LAYOUTS.Collection
                      ? "Manage Collection"
                      : "Fixed blocks"}
                  </Text>
                  <Text textStyle="caption-2" color="base.content.medium">
                    {pageLayout === ISOMER_USABLE_PAGE_LAYOUTS.Collection
                      ? "Modify the Collection’s look and feel or manage filters."
                      : "These are built into the layout, so you can’t delete them."}
                  </Text>
                </VStack>

                <FixedBlock />
              </VStack>
            </Disable>
          ) : (
            <RootStateDrawerBlocksSection
              disableBlocks={disableBlocks}
              onDragEnd={onDragEnd}
              isPreviewingIndexPage={isPreviewingIndexPage}
              savedPageState={savedPageState}
              invalidBlockIndexes={invalidBlockIndexes}
            />
          )}
        </VStack>
      </VStack>

      {isPreviewingIndexPage && (
        <RootStateDrawerPreviewFooter
          isSavingPage={isSavingPage}
          onConfirmConvertIndexPageModalOpen={
            onConfirmConvertIndexPageModalOpen
          }
          onCancelConversionToIndexPage={handleCancelConversionToIndexPage}
        />
      )}
    </Flex>
  )
}

export default RootStateDrawer
