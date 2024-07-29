import type { IsomerComponent } from "@opengovsg/isomer-components"
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
import Ajv from "ajv"
import { BiDollar, BiTrash, BiX } from "react-icons/bi"

import { useEditorDrawerContext } from "~/contexts/EditorDrawerContext"
import { DeleteBlockModal } from "./DeleteBlockModal"
import FormBuilder from "./form-builder/FormBuilder"

const ajv = new Ajv({ strict: false, logger: false })

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

  if (
    currActiveIdx === -1 ||
    !previewPageState ||
    !savedPageState ||
    currActiveIdx > previewPageState.content.length
  ) {
    return <></>
  }

  const component = previewPageState.content[currActiveIdx]

  if (!component) {
    return <></>
  }

  const subSchema = getComponentSchema(component.type)
  const { title } = subSchema
  const validateFn = ajv.compile<IsomerComponent>(subSchema)
  const componentName = title || "component"

  const handleDeleteBlock = () => {
    const updatedBlocks = Array.from(savedPageState.content)
    updatedBlocks.splice(currActiveIdx, 1)
    const newPageState = {
      ...previewPageState,
      content: updatedBlocks,
    }
    setSavedPageState(newPageState)
    setPreviewPageState(newPageState)
    onDeleteBlockModalClose()
    // TODO: don't close the modal
    // until we actually delete the item properly on the backend
    mutate(
      {
        pageId,
        siteId,
        content: JSON.stringify(newPageState),
      },
      { onSuccess: onDeleteBlockModalClose },
    )
    setDrawerState({ state: "root" })
  }

  const handleChange = (data: IsomerComponent) => {
    const updatedBlocks = Array.from(previewPageState.content)
    updatedBlocks[currActiveIdx] = data
    const newPageState = {
      ...previewPageState,
      content: updatedBlocks,
    }
    setPreviewPageState(newPageState)
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
              isDisabled={isLoading}
              onClick={() => {
                setPreviewPageState(savedPageState)
                setDrawerState({ state: "root" })
              }}
              aria-label="Close drawer"
            />
          </HStack>
        </Box>

        <Box px="2rem" py="1rem">
          <FormBuilder<IsomerComponent>
            schema={subSchema}
            validateFn={validateFn}
            data={component}
            handleChange={handleChange}
          />
        </Box>
      </Flex>

      <Box
        pos="sticky"
        bottom={0}
        bgColor="base.canvas.default"
        boxShadow="md"
        py="1.5rem"
        px="2rem"
        zIndex={1}
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
                setSavedPageState(previewPageState)
                mutate(
                  {
                    pageId,
                    siteId,
                    content: JSON.stringify(previewPageState),
                  },
                  { onSuccess: () => setDrawerState({ state: "root" }) },
                )
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
