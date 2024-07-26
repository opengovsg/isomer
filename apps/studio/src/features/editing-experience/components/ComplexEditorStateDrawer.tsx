import {
  Box,
  Flex,
  Heading,
  HStack,
  Icon,
  useDisclosure,
} from "@chakra-ui/react"
import { Button, IconButton } from "@opengovsg/design-system-react"
import { getComponentSchema } from "@opengovsg/isomer-components"
import { BiDollar, BiTrash, BiX } from "react-icons/bi"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { DeleteBlockModal } from "./DeleteBlockModal"
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
  const {
    isOpen: isDeleteBlockModalOpen,
    onOpen: onDeleteBlockModalOpen,
    onClose: onDeleteBlockModalClose,
  } = useDisclosure()

  if (currActiveIdx === -1 || currActiveIdx > savedPageState.length) {
    return <></>
  }

  const component = previewPageState[currActiveIdx]

  if (!component) {
    return <></>
  }

  const { title } = getComponentSchema(component.type)
  const componentName = title || "component"

  const handleDeleteBlock = () => {
    const updatedBlocks = Array.from(savedPageState)
    updatedBlocks.splice(currActiveIdx, 1)
    setSavedPageState(updatedBlocks)
    setPreviewPageState(updatedBlocks)
    onDeleteBlockModalClose()
    setDrawerState({ state: "root" })
  }

  return (
    <>
      <DeleteBlockModal
        itemName={componentName}
        isOpen={isDeleteBlockModalOpen}
        onClose={onDeleteBlockModalClose}
        onDelete={handleDeleteBlock}
      />
      <Flex
        flexDir="column"
        position="relative"
        h="100%"
        w="100%"
        overflow="auto"
      >
        <Box
          bgColor="base.canvas.default"
          borderBottomColor="base.divider.medium"
          borderBottomWidth="1px"
          px="2rem"
          py="1.25rem"
        >
          <HStack justifyContent="space-between" w="100%">
            <HStack spacing="0.75rem">
              <Icon
                as={BiDollar}
                fontSize="1.5rem"
                p="0.25rem"
                bgColor="slate.100"
                textColor="blue.600"
                borderRadius="base"
              />
              <Heading as="h3" size="sm" textStyle="h5" fontWeight="semibold">
                Edit {componentName}
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
      </Flex>

      <Box
        pos="sticky"
        bottom={0}
        bgColor="base.canvas.default"
        boxShadow="md"
        py="1.5rem"
        px="2rem"
      >
        <HStack spacing="0.75rem">
          <IconButton
            icon={<BiTrash fontSize="1.25rem" />}
            variant="outline"
            colorScheme="critical"
            aria-label="Delete block"
            onClick={onDeleteBlockModalOpen}
          />
          <Box w="100%">
            <Button
              w="100%"
              onClick={() => {
                setDrawerState({ state: "root" })
                setSavedPageState(previewPageState)
              }}
            >
              Save changes
            </Button>
          </Box>
        </HStack>
      </Box>
    </>
  )
}
