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
  state: DrawerState
}

export function EditPageDrawer({ isOpen: open, state }: EditPageDrawerProps) {
  const { drawerState: currState, setDrawerState: setCurrState } =
    useEditorDrawerContext()

  useEffect(() => {
    setCurrState(state)
  }, [])

  if (!currState) return <></>
  console.log(currState.state)
  switch (currState.state) {
    case 'root':
      return <RootStateDrawer blocks={currState.blocks} />
    case 'addBlock':
      return (
        <ComponentSelector
          onClose={() => setCurrState(state)}
          onProceed={(componentType) => console.log(componentType)}
        />
      )
    case 'nativeEditor':
      return (
        <TipTapComponent
          data="test"
          path="test"
          handleChange={(path: string, data: any) => console.log(path, data)}
          onProceed={(path: string, data: any) => console.log(path, data)}
          onClose={() => setCurrState(state)}
          type="paragraph"
        />
      )
    default:
      return <h1>Edit Page Drawer</h1>
  }
}

export default EditPageDrawer
