import { Text, Heading, VStack } from '@chakra-ui/react'
import { useState } from 'react'

type RootDrawerStateProps = {
  state: 'root'
  blocks: string[]
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

  switch (currState.state) {
    case 'root':
      return (
        <VStack>
          <Text fontSize={'xl'}>Custom blocks</Text>

          {currState.blocks.map((block) => {
            return <h1>{block}</h1>
          })}
        </VStack>
      )
    default:
      return <h1>Edit Page Drawer</h1>
  }
}

export default EditPageDrawer
