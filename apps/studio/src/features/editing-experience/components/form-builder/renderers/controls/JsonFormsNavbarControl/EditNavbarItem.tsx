import type {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  UISchemaElement,
} from "@jsonforms/core"
import {
  Box,
  HStack,
  Icon,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react"
import { computeChildLabel } from "@jsonforms/core"
import { JsonFormsDispatch, useJsonForms } from "@jsonforms/react"
import { Button } from "@opengovsg/design-system-react"
import get from "lodash/get"
import { BiDirections, BiLeftArrowAlt, BiTrash } from "react-icons/bi"

import type { NavbarItems } from "./types"
import { DeleteGroupModal } from "./DeleteGroupModal"

interface EditNavbarItemProps {
  renderers?: JsonFormsRendererRegistryEntry[]
  cells?: JsonFormsCellRendererRegistryEntry[]
  visible: boolean
  schema: JsonSchema
  uischema: UISchemaElement
  path: string
  onBack: () => void
  handleRemoveItem: () => void
}

export const EditNavbarItem = ({
  renderers,
  cells,
  visible,
  schema,
  uischema,
  path,
  onBack,
  handleRemoveItem,
}: EditNavbarItemProps) => {
  const {
    isOpen: isDeleteGroupModalOpen,
    onOpen: onDeleteGroupModalOpen,
    onClose: onDeleteGroupModalClose,
  } = useDisclosure()
  const ctx = useJsonForms()
  const subItems = get(ctx.core?.data, `${path}.items`) as
    | NavbarItems["items"]
    | undefined
  const label = computeChildLabel(
    ctx.core?.data,
    path,
    "",
    schema,
    ctx.core?.schema ?? {},
    ctx.i18n?.translate ?? ((s) => s),
    uischema,
  )

  return (
    <>
      <DeleteGroupModal
        label={label}
        subItemsCount={!!subItems ? subItems.length : 0}
        isOpen={isDeleteGroupModalOpen}
        onClose={onDeleteGroupModalClose}
        onDelete={() => {
          handleRemoveItem()
          onDeleteGroupModalClose()
        }}
      />

      <VStack
        position="absolute"
        top={0}
        left={0}
        w="full"
        h="full"
        zIndex={1}
        bg="grey.50"
        alignItems="start"
        gap={0}
      >
        {/* Header section */}
        <VStack
          px="1.5rem"
          pt="2rem"
          pb="1.5rem"
          gap="1.25rem"
          alignItems="start"
          w="full"
        >
          <Button
            variant="link"
            leftIcon={<BiLeftArrowAlt fontSize="1.25rem" />}
            onClick={onBack}
            textStyle="subhead-2"
          >
            Back to navigation menu
          </Button>

          <HStack gap="0.75rem" w="full" alignItems="center">
            <Box
              aria-hidden
              bg="brand.secondary.100"
              borderRadius="0.375rem"
              p="0.5rem"
              lineHeight="1rem"
            >
              <Icon as={BiDirections} fontSize="1rem" />
            </Box>

            <Text
              as="h2"
              textStyle="h3"
              textColor="base.content.default"
              textOverflow="ellipsis"
            >
              {label || "Add a new link"}
            </Text>
          </HStack>
        </VStack>

        <Box w="full">
          <Box w="full" h="full" px="1.5rem" overflow="auto">
            <JsonFormsDispatch
              renderers={renderers}
              cells={cells}
              visible={visible}
              schema={schema}
              uischema={uischema}
              path={path}
            />
          </Box>

          <HStack w="full" justifyContent="center" mt="-1.125rem" mb="1.5rem">
            <Button
              variant="clear"
              colorScheme="critical"
              size="xs"
              leftIcon={<Icon as={BiTrash} />}
              onClick={onDeleteGroupModalOpen}
            >
              Delete this link
            </Button>
          </HStack>
        </Box>
      </VStack>
    </>
  )
}
