import type { DropResult } from "@hello-pangea/dnd"
import { useCallback, useState } from "react"
import {
  Box,
  Button,
  Flex,
  Icon,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { DragDropContext, Droppable } from "@hello-pangea/dnd"
import { Infobox, useToast } from "@opengovsg/design-system-react"
import { ISOMER_USABLE_PAGE_LAYOUTS } from "@opengovsg/isomer-components"
import { ResourceType } from "~prisma/generated/generatedEnums"
import { BiData, BiPin, BiPlus, BiPlusCircle } from "react-icons/bi"

import { Disable } from "~/components/Disable"
import { DEFAULT_BLOCKS } from "~/components/PageEditor/constants"
import { BlockEditingPlaceholder } from "~/components/Svg"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { useQueryParse } from "~/hooks/useQueryParse"
import { ADMIN_ROLE } from "~/lib/growthbook"
import { trpc } from "~/utils/trpc"
import { TYPE_TO_ICON } from "../constants"
import { pageSchema } from "../schema"
import { ActivateRawJsonEditorMode } from "./ActivateRawJsonEditorMode"
import { BaseBlock } from "./Block/BaseBlock"
import { DraggableBlock } from "./Block/DraggableBlock"
import { ConfirmConvertIndexPageModal } from "./ConfirmConvertIndexPageModal"
import { CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE } from "./constants"

interface FixedBlockContent {
  label: string
  description: string
}

const FIXED_BLOCK_CONTENT: Record<string, FixedBlockContent> = {
  article: {
    label: "Article page header",
    description: "Category, Date, and Summary",
  },
  content: {
    label: "Content page header",
    description: "Summary, Button label, and Button destination",
  },
  database: {
    label: "Database page header",
    description: "Summary, Button label, and Button URL",
  },
  index: {
    label: "Header",
    description: "Summary, Button label and Button URL",
  },
}

export default function RootStateDrawer() {
  const {
    type,
    setDrawerState,
    setCurrActiveIdx,
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
  const isUserIsomerAdmin = useIsUserIsomerAdmin({
    roles: [ADMIN_ROLE.CORE, ADMIN_ROLE.MIGRATORS],
  })
  const toast = useToast()
  const { mutate } = trpc.page.reorderBlock.useMutation({
    onSuccess: async () => {
      await utils.page.readPage.invalidate({ pageId, siteId })
    },
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
        title: "Failed to update blocks",
        description: error.message,
        status: "error",
        ...BRIEF_TOAST_SETTINGS,
      })
    },
  })

  const { mutate: savePage, isPending: isSavingPage } =
    trpc.page.updatePageBlob.useMutation({
      onSuccess: async () => {
        await utils.page.readPageAndBlob.invalidate({ pageId, siteId })
        await utils.page.readPage.invalidate({ pageId, siteId })
        toast({
          status: "success",
          title: CHANGES_SAVED_PLEASE_PUBLISH_MESSAGE,
          ...BRIEF_TOAST_SETTINGS,
        })
      },
    })

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) return

      const from = result.source.index
      const to = result.destination.index
      const contentLength = savedPageState.content.length

      if (from >= contentLength || to >= contentLength || from < 0 || to < 0)
        return

      // NOTE: We eagerly update their page state here
      // and if it fails on the backend,
      // we rollback to what we passed them
      const updatedBlocks = Array.from(savedPageState.content)
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
      mutate({ pageId, from, to, blocks: savedPageState.content, siteId })
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
    // NOTE: This is defined but we just do the assertion here
    // because the type for `DEFAULT_BLOCKS` is possibly undefined
    // so `ts` cannot infer
    if (!DEFAULT_BLOCKS.childrenpages) return

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
        pageId,
        siteId,
        content: JSON.stringify(previewPageState),
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

  // NOTE: because we migrate from github -> studio
  // and also becuase our underlying is just json,
  // it's not guaranteed that our `rootpage` will always
  // have a hero banner
  const isHeroFixedBlock =
    pageLayout === "homepage" &&
    savedPageState.content.length > 0 &&
    savedPageState.content[0]?.type === "hero"

  const isCustomContentIndexPage =
    type === ResourceType.IndexPage &&
    pageLayout !== "index" &&
    pageLayout !== "collection"

  // NOTE: if a page has either of these `layouts`,
  // we should disable them from adding blocks
  // because folder index pages aren't intended to have
  // content yet and components don't render content
  // for collection index pages
  const canAddBlocks = pageLayout !== "index" && pageLayout !== "collection"

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
            onActivate={() => setDrawerState({ state: "rawJsonEditor" })}
          />
        )}

        <VStack w="100%" h="100%" gap="1rem">
          {isCustomContentIndexPage && (
            <Infobox
              width="100%"
              size="sm"
              border="1px solid"
              borderColor="utility.feedback.info"
              borderRadius="0.25rem"
            >
              <VStack spacing="0.75rem" alignItems="start">
                <VStack spacing="0.25rem" alignItems="start">
                  <Text textStyle="body-2">
                    You’re using a custom layout for this page.
                  </Text>
                  <Text textStyle="body-2">
                    You can choose to use the new index page layout, but you
                    will lose all custom content you’ve added.
                  </Text>
                </VStack>

                <Button
                  textStyle="body-2"
                  variant="link"
                  fontSize="0.875rem"
                  onClick={() => handleConversionToIndexPage()}
                >
                  Preview what this looks like
                </Button>
              </VStack>
            </Infobox>
          )}
          {!!scheduledAt && (
            <Infobox
              size="sm"
              border="1px solid"
              borderColor="utility.feedback.info"
              borderRadius="0.25rem"
            >
              <Text textStyle="body-2">
                This page is scheduled for publishing. To make changes, cancel
                the schedule first.
              </Text>
            </Infobox>
          )}
          {isPreviewingIndexPage && (
            <Infobox
              size="sm"
              border="1px solid"
              borderColor="utility.feedback.info"
              borderRadius="0.25rem"
              w="full"
            >
              <Text textStyle="body-2">
                You’re previewing what you’ll see once you accept the change.
              </Text>
            </Infobox>
          )}

          {/* Fixed Blocks Section */}
          <Disable when={disableBlocks}>
            <VStack gap="1.5rem" flex={1} w="full">
              <VStack gap="1rem" w="100%" align="start">
                <VStack gap="0.25rem" align="start">
                  <Text textStyle="subhead-1">Fixed blocks</Text>
                  <Text textStyle="caption-2" color="base.content.medium">
                    These components are fixed for the layout and cannot be
                    deleted
                  </Text>
                </VStack>

                {isHeroFixedBlock ? (
                  <BaseBlock
                    onClick={() => {
                      setCurrActiveIdx(0)
                      setDrawerState({ state: "heroEditor" })
                    }}
                    label="Hero banner"
                    description="Title, subtitle, and Call-to-Action"
                    icon={TYPE_TO_ICON.hero}
                  />
                ) : pageLayout === ISOMER_USABLE_PAGE_LAYOUTS.Database ? (
                  <VStack gap="1rem" w="100%" align="start">
                    <BaseBlock
                      onClick={() => {
                        setDrawerState({ state: "metadataEditor" })
                      }}
                      label="Page header"
                      description="Summary, Button label, and Button URL"
                      icon={BiPin}
                    />
                    <BaseBlock
                      onClick={() => {
                        setDrawerState({ state: "databaseEditor" })
                      }}
                      label="Database"
                      description="Link your dataset from Data.gov.sg"
                      icon={BiData}
                    />
                  </VStack>
                ) : (
                  <BaseBlock
                    onClick={() => {
                      setDrawerState({ state: "metadataEditor" })
                    }}
                    label={
                      FIXED_BLOCK_CONTENT[pageLayout]?.label ||
                      "Page description and summary"
                    }
                    description={
                      FIXED_BLOCK_CONTENT[pageLayout]?.description ||
                      "Click to edit"
                    }
                    icon={BiPin}
                  />
                )}
              </VStack>

              <VStack gap="1.5rem" w="100%">
                <VStack w="100%" h="100%" gap="1rem">
                  {/* Custom Blocks Section */}
                  {/* Custom Blocks Section */}
                  <Flex flexDirection="row" w="100%">
                    {pageLayout !== ISOMER_USABLE_PAGE_LAYOUTS.Collection && (
                      <VStack gap="0.25rem" align="start" flex={1}>
                        <Text textStyle="subhead-1">Custom blocks</Text>
                        <Text textStyle="caption-2" color="base.content.medium">
                          Use blocks to display your content in various ways
                        </Text>
                      </VStack>
                    )}
                    {/* TODO: we should swap over to using the `resource.type` */}
                    {/* rather than the `page.layout` but we are unable to do so due */}
                    {/* to the existence of custom index page that are `layout: */}
                    {/* content` but have `resource.type: index` */}
                    {canAddBlocks && (
                      <Button
                        size="xs"
                        flexShrink={0}
                        leftIcon={<BiPlusCircle fontSize="1.25rem" />}
                        variant="clear"
                        onClick={() => setDrawerState({ state: "addBlock" })}
                      >
                        Add block
                      </Button>
                    )}
                  </Flex>
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="blocks">
                      {(provided) => (
                        <VStack
                          {...provided.droppableProps}
                          w="100%"
                          ref={provided.innerRef}
                        >
                          <Box w="100%">
                            {!isPreviewingIndexPage &&
                              ((isHeroFixedBlock &&
                                savedPageState.content.length === 1) ||
                                (savedPageState.content.length === 0 &&
                                  canAddBlocks)) && (
                                <>
                                  <VStack
                                    justifyContent="center"
                                    spacing={0}
                                    mt="2.75rem"
                                    mb="1.5rem"
                                  >
                                    <BlockEditingPlaceholder />
                                    <Text
                                      mt="0.75rem"
                                      textStyle="subhead-1"
                                      color="base.content.default"
                                    >
                                      Blocks you add will appear here
                                    </Text>
                                    <Text
                                      mt="0.25rem"
                                      textStyle="caption-2"
                                      color="base.content.medium"
                                    >
                                      Click the ‘Add block’ button above to add
                                      blocks to this page
                                    </Text>
                                  </VStack>

                                  <Button
                                    variant="outline"
                                    w="100%"
                                    onClick={() =>
                                      setDrawerState({ state: "addBlock" })
                                    }
                                    leftIcon={
                                      <Icon as={BiPlus} fontSize="1.25rem" />
                                    }
                                  >
                                    Add a new block
                                  </Button>
                                </>
                              )}

                            <Flex flexDirection="column" mt="-0.25rem">
                              {previewPageState.content.map((block, index) => {
                                if (isHeroFixedBlock && index === 0) {
                                  return <></>
                                }

                                return (
                                  <DraggableBlock
                                    block={block}
                                    // TODO: Generate a block ID instead of index
                                    key={`${block.type}-${index}`}
                                    // TODO: Use block ID when instead of index for uniquely identifying blocks
                                    draggableId={`${block.type}-${index}`}
                                    index={index}
                                    onClick={() => {
                                      setCurrActiveIdx(index)
                                      // TODO: we should automatically do this probably?
                                      const nextState =
                                        savedPageState.content[index]?.type ===
                                        "prose"
                                          ? "nativeEditor"
                                          : "complexEditor"
                                      // NOTE: SNAPSHOT
                                      setDrawerState({ state: nextState })
                                    }}
                                  />
                                )
                              })}
                            </Flex>
                          </Box>
                          {provided.placeholder}
                        </VStack>
                      )}
                    </Droppable>
                  </DragDropContext>
                </VStack>
              </VStack>
            </VStack>
          </Disable>
        </VStack>
      </VStack>

      {isPreviewingIndexPage && (
        <Box
          bgColor="base.canvas.default"
          boxShadow="md"
          py="1.5rem"
          px="2rem"
          mt="auto"
        >
          <VStack spacing="1.25rem">
            <Infobox width="100%" size="sm" variant="warning">
              <Text textStyle="body-2">
                All custom content that was previously on this page will be lost
                once you press ‘Accept this change’.
              </Text>
            </Infobox>

            <VStack gap="1rem" w="full">
              <Button
                w="100%"
                isLoading={isSavingPage}
                onClick={onConfirmConvertIndexPageModalOpen}
              >
                Accept this change
              </Button>

              <Button
                w="100%"
                variant="outline"
                onClick={handleCancelConversionToIndexPage}
              >
                Keep old version
              </Button>
            </VStack>
          </VStack>
        </Box>
      )}
    </Flex>
  )
}
