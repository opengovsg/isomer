import type { DropResult } from "@hello-pangea/dnd"
import {
  Box,
  Button,
  Divider,
  HStack,
  Spacer,
  Text,
  VStack,
} from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { BsPlus } from "react-icons/bs"
import { MdOutlineDragIndicator } from "react-icons/md"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { trpc } from "~/utils/trpc"
import { useRouter } from "next/router"

export default function RootStateDrawer() {
  const {
    setDrawerState,
    pageState,
    setSnapshot,
    setCurrActiveIdx,
    setPageState
  } = useEditorDrawerContext()

  const router = useRouter()
  const pageId = Number(router.query.pageId)

  const { variables, mutate, isLoading } = trpc.page.reorderBlock.useMutation()

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    const updatedBlocks = Array.from(pageState)
    const from = result.source.index
    const to = result.destination.index

    // NOTE: drive an update to the db with the updated index
    // TODO: update teh page state when we get it back from db
    setPageState(updatedBlocks)
    mutate({ pageId, from, to, blocks: pageState }, {
      // onSuccess: (data) => {
      //   console.log("data", data)
      // }
    })
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
                  {pageState.map((block, index) => (
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
                              pageState[index]?.type === "prose"
                                ? "nativeEditor"
                                : "complexEditor"
                            // NOTE: SNAPSHOT
                            setSnapshot(pageState)
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
                            <MdOutlineDragIndicator
                              style={{
                                marginLeft: "0.75rem",
                                width: "1.5rem",
                                height: "1.5rem",
                              }}
                            />
                            <Text px="3" fontWeight={500}>
                              {block.type}
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
