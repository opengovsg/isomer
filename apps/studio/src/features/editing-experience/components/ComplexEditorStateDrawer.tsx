import { Box, Heading, HStack, Icon } from "@chakra-ui/react"
import { Button, IconButton } from "@opengovsg/design-system-react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { BiDollar, BiX } from "react-icons/bi"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import FormBuilder from "./form-builder/FormBuilder"

export default function ComplexEditorStateDrawer(): JSX.Element {
  const {
    currActiveIdx,
    setDrawerState,
    savedPageState,
    setSavedPageState,
    previewPageState,
    setPreviewPageState,
  } = useEditorDrawerContext()

  if (currActiveIdx === -1 || currActiveIdx > savedPageState.length) {
    return <></>
  }

  const component = previewPageState[currActiveIdx]

  if (!component) {
    return <></>
  }

  const { title } = getComponentSchema(component.type)

  return (
    <Box position="relative" h="100%" w="100%" overflow="auto">
      <Box
        bgColor="base.canvas.default"
        borderBottomColor="base.divider.medium"
        borderBottomWidth="1px"
        px="2rem"
        py="1.25rem"
      >
        <HStack justifyContent="space-between" w="100%">
          <HStack spacing={3}>
            <Icon
              as={BiDollar}
              fontSize="1.5rem"
              p="0.25rem"
              bgColor="slate.100"
              textColor="blue.600"
              borderRadius="base"
            />
            <Heading as="h3" size="sm" textStyle="h5" fontWeight="semibold">
              Edit {title}
            </Heading>
          </HStack>
          <IconButton
            icon={<Icon as={BiX} />}
            variant="clear"
            colorScheme="sub"
            size="sm"
            p="0.625rem"
            onClick={() => {
              setPreviewPageState(savedPageState)
              setDrawerState({ state: "root" })
            }}
            aria-label="Close drawer"
          />
        </HStack>
      </Box>
      <Box px="2rem" py="1rem">
        <FormBuilder />
      </Box>
      <Box px="2rem" pb="1.5rem">
        <Button
          w="100%"
          onClick={() => {
            setDrawerState({ state: "root" })
            setSavedPageState(previewPageState)
          }}
        >
          Save
        </Button>
      </Box>
    </Box>
  )
}
