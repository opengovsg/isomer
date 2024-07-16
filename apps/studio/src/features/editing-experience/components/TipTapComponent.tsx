import { Box, Flex, Icon, VStack, Text as ChakraText } from '@chakra-ui/react'
import { Button, IconButton } from '@opengovsg/design-system-react'
import { HardBreak } from '@tiptap/extension-hard-break'
import { Blockquote } from '@tiptap/extension-blockquote'
import { Bold } from '@tiptap/extension-bold'
import { BulletList } from '@tiptap/extension-bullet-list'
import { Document } from '@tiptap/extension-document'
import { Dropcursor } from '@tiptap/extension-dropcursor'
import { Gapcursor } from '@tiptap/extension-gapcursor'
import { Heading } from '@tiptap/extension-heading'
import { History } from '@tiptap/extension-history'
import { HorizontalRule } from '@tiptap/extension-horizontal-rule'
import { Italic } from '@tiptap/extension-italic'
import { ListItem } from '@tiptap/extension-list-item'
import { OrderedList } from '@tiptap/extension-ordered-list'
import { Paragraph } from '@tiptap/extension-paragraph'
import { Strike } from '@tiptap/extension-strike'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { Text } from '@tiptap/extension-text'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import TableRow from '@tiptap/extension-table-row'
import {
  EditorContent,
  useEditor,
  type JSONContent,
} from '@tiptap/react'
import { BiText, BiX } from 'react-icons/bi'
import Underline from '@tiptap/extension-underline'
import { MenuBar } from '~/components/PageEditor/MenuBar'

import { useEditorDrawerContext } from '~/contexts/EditorDrawerContext'
import { cloneDeep } from 'lodash'
import { Table } from './extensions/Table'
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
      <Box p="2rem" h="100%">
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
