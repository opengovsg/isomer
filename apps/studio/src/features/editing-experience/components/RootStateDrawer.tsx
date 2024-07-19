import type { DropResult } from "@hello-pangea/dnd"
import { useRouter } from "next/router"
import {
  Box,
  Button,
  Divider,
  HStack,
  Icon,
  Spacer,
  Text,
  VStack,
} from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { useToast } from "@opengovsg/design-system-react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { BiGridVertical } from "react-icons/bi"
import { BsPlus } from "react-icons/bs"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { trpc } from "~/utils/trpc"

export default function RootStateDrawer() {
  const {
    setDrawerState,
    setCurrActiveIdx,
    savedPageState,
    setSavedPageState,
    setPreviewPageState,
  } = useEditorDrawerContext()
  const router = useRouter()
  const pageId = Number(router.query.pageId)
  const { mutate } = trpc.page.reorderBlock.useMutation()
  const toast = useToast({ status: "error" })

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const from = result.source.index
    const to = result.destination.index

    if (
      from >= savedPageState.length ||
      to >= savedPageState.length ||
      from < 0 ||
      to < 0
    )
      return

    // NOTE: We eagerly update their page state here
    // and if it fails on the backend,
    // we rollback to what we passed them
    const updatedBlocks = Array.from()
    const [movedBlock] = updatedBlocks.splice(from, 1)

    if (!!movedBlock) {
      updatedBlocks.splice(to, 0, movedBlock)
      setPreviewPageState(savedPageState)
      setSavedPageState(savedPageState)
    }

    // NOTE: drive an update to the db with the updated index
    mutate(
      { pageId, from, to, blocks: savedPageState },
      {
        onError: (error, variables) => {
          // NOTE: rollback to last known good state
          // @ts-expect-error Our zod validator runs between frontend and backend
          // and the error type is automatically inferred from the zod validator.
          // However, the type that we use on `pageState` is the full type
          // because `Preview` (amongst other things) requires the other properties on the actual schema type
          setPreviewPageState(updatedBlocks)
          setSavedPageState(updatedBlocks)
          toast({
            title: "Failed to update blocks",
            description: error.message,
          })
        },
      },
    )
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
                              {getComponentSchema(block.type).title}
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
      <Spacer />
      {/* TODO: Add New Block Section */}
      <Box
        w="100%"
        bgColor="white"
        p="1.5rem 2rem 1.5rem 2rem"
        boxShadow="0px 0px 10px 0px #BFBFBF80"
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
