import { Text, Heading, VStack, HStack, Box, Divider } from '@chakra-ui/react'
import { useState } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import { MdOutlineDragIndicator } from 'react-icons/md'

type Block = {
  text: string
  id: string
}

type RootDrawerStateProps = {
  state: 'root'
  blocks: Block[]
}

type AddNewBlockStateProps = {
  state: 'addBlock'
}

type NativeEditorStateProps = {
  state: 'nativeEditor'
}

type ComplexEditorStateProps = {
  state: 'complexEditor'
}

type DrawerState =
  | RootDrawerStateProps
  | AddNewBlockStateProps
  | NativeEditorStateProps
  | ComplexEditorStateProps

type EditPageDrawerProps = {
  open: boolean
  state: DrawerState
}

export const EditPageDrawer = ({ open, state }: EditPageDrawerProps) => {
  const [currState, setCurrState] = useState<DrawerState>(state)

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return

    if (currState.state === 'root') {
      const updatedBlocks = Array.from(currState.blocks)
      // Remove block at source index
      const [movedBlock] = updatedBlocks.splice(result.source.index, 1)
      // Insert at destination index
      updatedBlocks.splice(result.destination.index, 0, movedBlock!)

      setCurrState({
        ...currState,
        blocks: updatedBlocks,
      })
    }
  }

  switch (currState.state) {
    case 'root':
      return (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="blocks">
            {(provided) => (
              <VStack
                {...provided.droppableProps}
                align={'baseline'}
                w={'100%'}
                ref={provided.innerRef}
              >
                <Text fontSize={'xl'} pl={4}>
                  Custom blocks
                </Text>
                <Box w="100%">
                  {currState.blocks.map((block, index) => (
                    <Draggable
                      key={block.id}
                      draggableId={block.id}
                      index={index}
                    >
                      {(provided) => (
                        <VStack w="100%" gap={0}>
                          <HStack
                            w="100%"
                            py="4"
                            bgColor={'white'}
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                          >
                            <MdOutlineDragIndicator
                              style={{
                                marginLeft: '0.75rem',
                                width: '1.5rem',
                                height: '1.5rem',
                              }}
                            />
                            <Text px="3">{block.text}</Text>
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
      )
    default:
      return <h1>Edit Page Drawer</h1>
  }
}

export default EditPageDrawer
