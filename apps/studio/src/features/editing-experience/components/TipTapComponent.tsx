import { Box, Flex, Icon, VStack, Text as ChakraText } from '@chakra-ui/react'
import { Button, IconButton } from '@opengovsg/design-system-react'
import {
  type JSONContent,
} from '@tiptap/react'
import { BiText, BiX } from 'react-icons/bi'

import { useEditorDrawerContext } from '~/contexts/EditorDrawerContext'
import { cloneDeep } from 'lodash'
import type { ProseProps } from '@opengovsg/isomer-components'
import { TiptapEditor } from './form-builder/renderers/TipTapEditor'

interface TipTapComponentProps {
  content: ProseProps
}

function TipTapComponent({ content }: TipTapComponentProps) {
  const { setDrawerState, setPageState, currActiveIdx, snapshot } =
    useEditorDrawerContext()

  const updatePageState = (editorContent: JSONContent) => {
    // TODO: actual validation 
    const content = editorContent as ProseProps
    setPageState((oldState) => {
      // TODO: performance - this is a full clone
      // of the object, which is expensive
      const newState = cloneDeep(oldState)
      newState[currActiveIdx] = content
      return newState
    })
  }

  return (
    <VStack bg="white" h="100%" gap="0">
      <Flex
        px="2rem"
        py="1.25rem"
        borderBottom="1px solid"
        borderColor="base.divider.strong"
        w="100%"
        alignItems="center"
      >
        <Icon as={BiText} color="blue.600" />
        <ChakraText pl="0.75rem" textStyle="h5" w="100%">
          Prose
        </ChakraText>
        <IconButton
          size="lg"
          variant="clear"
          colorScheme="neutral"
          color="interaction.sub.default"
          aria-label="Close add component"
          icon={<BiX />}
          onClick={() => {
            setPageState(snapshot)
            setDrawerState({ state: 'root' })
          }}
        />
      </Flex>
      <Box w="100%" p="2rem" h="100%">
        <TiptapEditor data={content} handleChange={updatePageState} />
      </Box>
      <Flex
        px="2rem"
        py="1.25rem"
        borderTop="1px solid"
        borderColor="base.divider.strong"
        w="100%"
        justifyContent="end"
      >
        <Button
          onClick={() => {
            setDrawerState({ state: 'root' })
          }}
        >
          Save
        </Button>
      </Flex>
    </VStack>
  )
}

export default TipTapComponent
