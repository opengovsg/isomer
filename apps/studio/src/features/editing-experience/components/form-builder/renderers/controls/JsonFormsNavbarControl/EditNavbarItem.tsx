import type {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  StatePropsOfMasterItem,
  UISchemaElement,
} from "@jsonforms/core"
import { Box, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import {
  JsonFormsDispatch,
  withJsonFormsMasterListItemProps,
} from "@jsonforms/react"
import { Button } from "@opengovsg/design-system-react"
import { BiLeftArrowAlt, BiSitemap, BiTrash } from "react-icons/bi"

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

const NavbarItemLabel = withJsonFormsMasterListItemProps(
  ({ childLabel }: StatePropsOfMasterItem) => (
    <Text
      as="h2"
      textStyle="h3"
      textColor="base.content.default"
      textOverflow="ellipsis"
    >
      {childLabel || "Add a new link"}
    </Text>
  ),
)

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
  return (
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
          textStyle="subhead-1"
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
            <Icon as={BiSitemap} fontSize="1rem" />
          </Box>

          <NavbarItemLabel
            index={Number(path.split(".").pop() ?? 0)}
            selected={false}
            path={path.split(".").slice(0, -1).join(".")}
            enabled={true}
            schema={schema}
            uischema={uischema}
            handleSelect={() => () => undefined}
            removeItem={() => () => undefined}
            translations={{}}
          />
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
            onClick={handleRemoveItem}
          >
            Delete this link
          </Button>
        </HStack>
      </Box>
    </VStack>
  )
}
