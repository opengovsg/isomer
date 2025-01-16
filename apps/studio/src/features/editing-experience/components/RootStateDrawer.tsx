import type { DropResult } from "@hello-pangea/dnd"
import { useCallback } from "react"
import { Box, Button, Flex, Icon, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Droppable } from "@hello-pangea/dnd"
import { Infobox, useToast } from "@opengovsg/design-system-react"
import { BiPin, BiPlus, BiPlusCircle } from "react-icons/bi"

import { BlockEditingPlaceholder } from "~/components/Svg"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { TYPE_TO_ICON } from "../constants"
import { editPageSchema } from "../schema"
import { ActivateRawJsonEditorMode } from "./ActivateRawJsonEditorMode"
import { BaseBlock } from "./Block/BaseBlock"
import { DraggableBlock } from "./Block/DraggableBlock"

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
}

export default function RootStateDrawer() {
  const {
    setDrawerState,
    setCurrActiveIdx,
    savedPageState,
    setSavedPageState,
    setPreviewPageState,
  } = useEditorDrawerContext()

  const { pageId, siteId } = useQueryParse(editPageSchema)
  const utils = trpc.useUtils()
  const isUserIsomerAdmin = useIsUserIsomerAdmin()
  const toast = useToast({ status: "error" })

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

  const pageLayout: string = savedPageState.layout

  const isHeroFixedBlock =
    pageLayout === "homepage" &&
    savedPageState.content.length > 0 &&
    savedPageState.content[0]?.type === "hero"

  return (
    <VStack gap="1.5rem" p="1.5rem">
      {isUserIsomerAdmin && <ActivateRawJsonEditorMode />}
      {/* Fixed Blocks Section */}
      <VStack gap="1rem" w="100%" align="start">
        <VStack gap="0.25rem" align="start">
          <Text textStyle="subhead-1">Fixed blocks</Text>
          <Text textStyle="caption-2" color="base.content.medium">
            These components are fixed for the layout and cannot be deleted
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
              FIXED_BLOCK_CONTENT[pageLayout]?.description || "Click to edit"
            }
            icon={BiPin}
          />
        )}
      </VStack>

      {pageLayout === "index" && savedPageState.content.length === 0 ? (
        <Infobox variant="warning" size="sm">
          <Box>
            <Text textStyle="subhead-2" mb="0.25rem">
              Why can’t I add anything else to this page?
            </Text>

            <Text textStyle="body-2">
              Content for this page is auto-generated. We’re introducing editing
              for this page type soon, so that you can add custom content
              alongside the page links.
            </Text>
          </Box>
        </Infobox>
      ) : (
        <VStack w="100%" h="100%" gap="1rem">
          {/* Custom Blocks Section */}
          <Flex flexDirection="row" w="100%">
            <VStack gap="0.25rem" align="start" flex={1}>
              <Text textStyle="subhead-1">Custom blocks</Text>
              <Text textStyle="caption-2" color="base.content.medium">
                Use blocks to display your content in various ways
              </Text>
            </VStack>
            <Button
              size="xs"
              flexShrink={0}
              leftIcon={<BiPlusCircle fontSize="1.25rem" />}
              variant="clear"
              onClick={() => setDrawerState({ state: "addBlock" })}
            >
              Add block
            </Button>
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
                    {((isHeroFixedBlock &&
                      savedPageState.content.length === 1) ||
                      savedPageState.content.length === 0) && (
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
                            Click the ‘Add block’ button above to add blocks to
                            this page
                          </Text>
                        </VStack>

                        <Button
                          variant="outline"
                          w="100%"
                          onClick={() => setDrawerState({ state: "addBlock" })}
                          leftIcon={<Icon as={BiPlus} fontSize="1.25rem" />}
                        >
                          Add a new block
                        </Button>
                      </>
                    )}

                    <Flex flexDirection="column" mt="-0.25rem">
                      {savedPageState.content.map((block, index) => {
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
                                savedPageState.content[index]?.type === "prose"
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
      )}
    </VStack>
  )
}
