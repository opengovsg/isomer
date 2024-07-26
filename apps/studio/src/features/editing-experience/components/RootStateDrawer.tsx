import type { DropResult } from "@hello-pangea/dnd"
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
import { getComponentSchema } from "@opengovsg/isomer-components"
import { BiGridVertical } from "react-icons/bi"
import { BsPlus } from "react-icons/bs"

import { BlockEditingPlaceholder } from "~/components/Svg"
import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"

export default function RootStateDrawer() {
  const {
    setDrawerState,
    setCurrActiveIdx,
    savedPageState,
    setSavedPageState,
    setPreviewPageState,
  } = useEditorDrawerContext()

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const updatedBlocks = Array.from(savedPageState)
    // Remove block at source index
    const [movedBlock] = updatedBlocks.splice(result.source.index, 1)
    if (movedBlock) {
      // Insert at destination index
      updatedBlocks.splice(result.destination.index, 0, movedBlock)
    }

    setPreviewPageState(updatedBlocks)
    setSavedPageState(updatedBlocks)
  }

  return (
    <VStack w="100%" h="100%" gap={10} pt={10}>
      {/* TODO: Fixed Blocks Section */}
      <VStack w="100%" align="baseline">
        <Text fontSize="xl" pl={4} fontWeight={500}>
          Fixed blocks
        </Text>
        <HStack w="100%" py="4" bgColor="white">
          <VStack w="100%" align="baseline" pl={1}>
            <Text px="3" fontWeight={500}>
              Page header
            </Text>
            <Text px="3">Title, summary, and Call-to-Action</Text>
          </VStack>
        </HStack>
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
                  {savedPageState.length === 0 && (
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

                  {savedPageState.map((block, index) => (
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
                              savedPageState[index]?.type === "prose"
                                ? "nativeEditor"
                                : "complexEditor"
                            // NOTE: SNAPSHOT
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
                                ? "Prose component"
                                : getComponentSchema(block.type).title}
                            </Text>
                          </HStack>
                          <Divider />
                        </VStack>
                      )}
                    </Draggable>
                  ))}
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
