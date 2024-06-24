import { Text, VStack, HStack, Box, Divider, Spacer } from '@chakra-ui/react'
import { useEffect, useState } from 'react'
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
import { type DrawerState } from '~/types/editorDrawer'
import { useEditorDrawerContext } from '~/contexts/EditorDrawerContext'
import ComponentSelector from '~/components/PageEditor/ComponentSelector'
import TipTapComponent from './TipTapComponent'

type EditPageDrawerProps = {
  isOpen: boolean
}

export function EditPageDrawer({ isOpen: open }: EditPageDrawerProps) {
  const { drawerState: currState } = useEditorDrawerContext()

  switch (currState.state) {
    case 'root':
      return <RootStateDrawer />
    case 'addBlock':
      return <ComponentSelector />
    case 'nativeEditor':
      return <TipTapComponent data="test" path="test" type="paragraph" />
    default:
      return <h1>Edit Page Drawer</h1>
  }
}

export default EditPageDrawer
