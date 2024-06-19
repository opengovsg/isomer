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
import RootStateDrawer, { Block } from './RootStateDrawer'

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
  isOpen: boolean
  state: DrawerState
}

export const EditPageDrawer = ({
  isOpen: open,
  state,
}: EditPageDrawerProps) => {
  const [currState, setCurrState] = useState<DrawerState>(state)

  switch (currState.state) {
    case 'root':
      return <RootStateDrawer blocks={currState.blocks} />
    default:
      return <h1>Edit Page Drawer</h1>
  }
}

export default EditPageDrawer
