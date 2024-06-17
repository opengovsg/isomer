import { Text, VStack, HStack, Box, Divider, Spacer } from '@chakra-ui/react'
import { useState } from 'react'
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd'
import { MdOutlineDragIndicator } from 'react-icons/md'
import { BsPlus } from 'react-icons/bs'
import { Button } from '@opengovsg/design-system-react'
import RootStateDrawer from './RootStateDrawer'

type Block = {
  text: string
  id: string
}

export type RootDrawerState = {
  state: 'root'
  blocks: Block[]
}

type AddNewBlockState = {
  state: 'addBlock'
}

type NativeEditorState = {
  state: 'nativeEditor'
}

type ComplexEditorState = {
  state: 'complexEditor'
}

type DrawerState =
  | RootDrawerState
  | AddNewBlockState
  | NativeEditorState
  | ComplexEditorState

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
      return <RootStateDrawer onDragEnd={onDragEnd} currState={currState} />
    default:
      return <h1>Edit Page Drawer</h1>
  }
}

export default EditPageDrawer
