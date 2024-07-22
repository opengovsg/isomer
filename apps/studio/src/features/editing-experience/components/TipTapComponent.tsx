import type { ProseProps } from "@opengovsg/isomer-components/dist/cjs/interfaces"
import type { JSONContent } from "@tiptap/react"
import { Box, Text as ChakraText, Flex, Icon, VStack } from "@chakra-ui/react"
import { Button, IconButton } from "@opengovsg/design-system-react"
import { cloneDeep } from "lodash"
import { BiText, BiX } from "react-icons/bi"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { TiptapEditor } from "./form-builder/renderers/TipTapEditor"

interface TipTapComponentProps {
  content: ProseProps
}

function TipTapComponent({ content }: TipTapComponentProps) {
  const {
    setDrawerState,
    savedPageState,
    setSavedPageState,
    previewPageState,
    setPreviewPageState,
    currActiveIdx,
  } = useEditorDrawerContext()

  const updatePageState = (editorContent: JSONContent) => {
    // TODO: actual validation
    const content = editorContent as ProseProps
    setPreviewPageState((oldState) => {
      // TODO: performance - this is a full clone
      // of the object, which is expensive
      const newState = cloneDeep(oldState)
      newState[currActiveIdx] = content
      return newState
    })
  }

  // TODO: Add a loading state or use suspsense
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
            setDrawerState({ state: "root" })
            setPreviewPageState(savedPageState)
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
            setDrawerState({ state: "root" })
            setSavedPageState(previewPageState)
          }}
        >
          Save
        </Button>
      </Flex>
    </VStack>
  )
}

export default TipTapComponent
