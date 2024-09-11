import type { DropResult } from "@hello-pangea/dnd"
import type { IsomerSchema } from "@opengovsg/isomer-components"
import type { IconType } from "react-icons"
import { useCallback } from "react"
import {
  Box,
  Button,
  chakra,
  Flex,
  HStack,
  Icon,
  Spacer,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { useToast } from "@opengovsg/design-system-react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import {
  BiCrown,
  BiGridVertical,
  BiHash,
  BiImage,
  BiPlusCircle,
} from "react-icons/bi"

import { BlockEditingPlaceholder } from "~/components/Svg"
import { PROSE_COMPONENT_NAME } from "~/constants/formBuilder"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { editPageSchema } from "../schema"
import { ActivateAdminMode } from "./ActivateAdminMode"
import { DraggableBlock } from "./Block/DraggableBlock"
import { ContentpicIcon } from "./icons/Contentpic"

const TYPE_TO_ICON: Partial<
  Record<IsomerSchema["content"][number]["type"], IconType>
> = {
  image: BiImage,
  infopic: BiImage,
  keystatistics: BiHash,
  contentpic: ContentpicIcon,
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
  const { mutate } = trpc.page.reorderBlock.useMutation({
    onError: (error, variables) => {
      // NOTE: rollback to last known good state
      // @ts-expect-error Our zod validator runs between frontend and backend
      // and the error type is automatically inferred from the zod validator.
      // However, the type that we use on `pageState` is the full type
      // because `Preview` (amongst other things) requires the other properties on the actual schema type
      setPreviewPageState(variables.blocks)
      // @ts-expect-error See above
      setSavedPageState(variables.blocks)
      toast({
        title: "Failed to update blocks",
        description: error.message,
      })
    },
  })

  const toast = useToast({ status: "error" })

  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination || !savedPageState) return

      const from = result.source.index
      const to = result.destination.index
      const contentLength = savedPageState.content.length ?? 0

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

  const isHeroFixedBlock =
    savedPageState?.layout === "homepage" &&
    savedPageState.content.length > 0 &&
    savedPageState.content[0]?.type === "hero"

  return (
    <VStack gap="1.5rem" px="1.25rem" py="1.5rem">
      <ActivateAdminMode />
      {/* Fixed Blocks Section */}
      <VStack align="baseline" gap="1rem" w="100%">
        <VStack gap="0.25rem" align="start">
          <Text textStyle="subhead-1">Fixed blocks</Text>
          <Text textStyle="caption-2" color="base.content.medium">
            These components are fixed for the layout and cannot be deleted
          </Text>
        </VStack>
        {isHeroFixedBlock ? (
          <Stack
            as="button"
            onClick={() => {
              setCurrActiveIdx(0)
              setDrawerState({ state: "heroEditor" })
            }}
            layerStyle="focusRing"
            w="100%"
            borderRadius="6px"
            border="1px solid"
            borderColor="base.divider.medium"
            transitionProperty="common"
            transitionDuration="normal"
            _hover={{
              bg: "interaction.muted.main.hover",
            }}
            bg="white"
            py="0.5rem"
            px="0.75rem"
            flexDirection="row"
            align="center"
          >
            <Flex
              p="0.25rem"
              bg="interaction.main-subtle.default"
              borderRadius="4px"
            >
              <Icon
                as={BiCrown}
                fontSize="0.75rem"
                color="base.content.default"
              />
            </Flex>
            <Stack flexDirection="column" align="start" gap="0.25rem">
              <Text textStyle="subhead-2">Hero banner</Text>
              <Text textStyle="caption-2">
                Title, subtitle, and Call-to-Action
              </Text>
            </Stack>
          </Stack>
        ) : (
          <Box
            as="button"
            onClick={() => {
              setDrawerState({ state: "metadataEditor" })
            }}
            w="100%"
          >
            <HStack w="100%" py="4" bgColor="white">
              <VStack w="100%" align="baseline" pl={1}>
                <Text px="3" fontWeight={500}>
                  Page title and summary
                </Text>
                <Text px="3">Click to edit</Text>
              </VStack>
            </HStack>
          </Box>
        )}
      </VStack>

      <VStack w="100%" h="100%" gap="1rem">
        {/* Custom Blocks Section */}
        <Flex flexDirection="row" w="100%" flexWrap="wrap">
          <VStack gap="0.25rem" align="start" w="100%" maxW="18rem">
            <Text textStyle="subhead-1">Custom blocks</Text>
            <Text textStyle="caption-2" color="base.content.medium">
              Use blocks to display your content in various ways
            </Text>
          </VStack>
          <Flex flex={1} pl="1.25rem" justify="end">
            <Spacer width="1.25rem" />
            <Button
              size="xs"
              leftIcon={<BiPlusCircle fontSize="1.25rem" />}
              variant="clear"
              onClick={() => setDrawerState({ state: "addBlock" })}
            >
              Add block
            </Button>
          </Flex>
        </Flex>
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="blocks">
            {(provided) => (
              <VStack
                {...provided.droppableProps}
                align="baseline"
                w="100%"
                ref={provided.innerRef}
              >
                <Box w="100%">
                  {(!savedPageState ||
                    (isHeroFixedBlock && savedPageState.content.length === 1) ||
                    savedPageState.content.length === 0) && (
                    <VStack justifyContent="center" spacing={0} mt="2.75rem">
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
                        Click the ‘Add block’ button above to add blocks to this
                        page
                      </Text>
                    </VStack>
                  )}

                  {!!savedPageState && (
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
                  )}
                </Box>
                {provided.placeholder}
              </VStack>
            )}
          </Droppable>
        </DragDropContext>
      </VStack>
    </VStack>
  )
}
