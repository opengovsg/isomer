import type { DropResult } from "@hello-pangea/dnd"
import { useCallback } from "react"
import {
  Box,
  Button,
  Divider,
  HStack,
  Icon,
  Text,
  VStack,
} from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { useToast } from "@opengovsg/design-system-react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { BiGridVertical } from "react-icons/bi"
import { BsPlus } from "react-icons/bs"

import { BlockEditingPlaceholder } from "~/components/Svg"
import { PROSE_COMPONENT_NAME } from "~/constants/formBuilder"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { editPageSchema } from "../schema"
import { ActivateAdminMode } from "./ActivateAdminMode"

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
    <VStack w="100%" h="100%" gap={10} pt={10}>
      <ActivateAdminMode />
      {/* TODO: Fixed Blocks Section */}
      <VStack w="100%" align="baseline">
        <Text fontSize="xl" pl={4} fontWeight={500}>
          Fixed blocks
        </Text>

        {isHeroFixedBlock ? (
          <Box
            as="button"
            onClick={() => {
              setCurrActiveIdx(0)
              setDrawerState({ state: "heroEditor" })
            }}
            w="100%"
          >
            <HStack w="100%" py="4" bgColor="white">
              <VStack w="100%" align="baseline" pl={1}>
                <Text px="3" fontWeight={500}>
                  Hero banner
                </Text>
                <Text px="3">Title, subtitle, and Call-to-Action</Text>
              </VStack>
            </HStack>
          </Box>
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

      <VStack justifyContent="space-between" w="100%" h="100%">
        {/* Custom Blocks Section */}
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="blocks">
            {(provided) => (
              <VStack
                {...provided.droppableProps}
                align="baseline"
                w="100%"
                ref={provided.innerRef}
              >
                <Text fontSize="xl" pl={4} fontWeight={500}>
                  Custom blocks
                </Text>
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
                        Click ‘Add a new block’ below to add blocks to this page
                      </Text>
                    </VStack>
                  )}

                  {!!savedPageState &&
                    savedPageState.content.map((block, index) => {
                      if (isHeroFixedBlock && index === 0) {
                        return <></>
                      }

                      return (
                        <Draggable
                          // TODO: Determine key + draggable id
                          key={index}
                          draggableId={`${block.type}-${index}`}
                          index={index}
                        >
                          {(provided) => (
                            <VStack
                              w="100%"
                              gap={0}
                              onClick={() => {
                                setCurrActiveIdx(index)
                                // TODO: we should automatically do this probably?
                                const nextState =
                                  savedPageState.content[index]?.type ===
                                  "prose"
                                    ? "nativeEditor"
                                    : "complexEditor"
                                setDrawerState({ state: nextState })
                              }}
                            >
                              <HStack
                                w="100%"
                                py="4"
                                bgColor="white"
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                              >
                                <Icon
                                  as={BiGridVertical}
                                  fontSize="1.5rem"
                                  ml="0.75rem"
                                />
                                <Text px="3" fontWeight={500}>
                                  {/*  NOTE: Because we use `Type.Ref` for prose, */}
                                  {/* this gets a `$Ref` only and not the concrete values */}
                                  {block.type === "prose"
                                    ? PROSE_COMPONENT_NAME
                                    : getComponentSchema(block.type).title}
                                </Text>
                              </HStack>
                              <Divider />
                            </VStack>
                          )}
                        </Draggable>
                      )
                    })}
                </Box>
                {provided.placeholder}
              </VStack>
            )}
          </Droppable>
        </DragDropContext>
      </VStack>
      <Box
        w="100%"
        bgColor="base.canvas.default"
        boxShadow="md"
        pos="sticky"
        py="1.5rem"
        px="2rem"
        bottom={0}
      >
        <Button
          w="100%"
          variant="outline"
          onClick={() => setDrawerState({ state: "addBlock" })}
        >
          <BsPlus style={{ height: "1.25rem", width: "1.25rem" }} />
          Add a new block
        </Button>
      </Box>
    </VStack>
  )
}
