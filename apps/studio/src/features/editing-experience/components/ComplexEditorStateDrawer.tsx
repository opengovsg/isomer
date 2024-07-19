import { Box, Heading, HStack, Icon } from "@chakra-ui/react"
import { Button, IconButton } from "@opengovsg/design-system-react"
import { BiDollar, BiX } from "react-icons/bi"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import FormBuilder from "./form-builder/FormBuilder"

export default function ComplexEditorStateDrawer(): JSX.Element {
  const {
    setDrawerState,
    savedPageState,
    setSavedPageState,
    previewPageState,
    setPreviewPageState,
    blockIndex,
  } = useEditorDrawerContext()

  if (blockIndex === -1 || blockIndex > savedPageState.length) {
    return <></>
  }

  const component = savedPageState[blockIndex]

  if (!component) {
    return <></>
  }

  return (
    <Box position="relative" h="100%" w="100%">
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
              Edit{" "}
              {component.type.charAt(0).toUpperCase() + component.type.slice(1)}
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
      <Box px="2rem" py="1.5rem">
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
