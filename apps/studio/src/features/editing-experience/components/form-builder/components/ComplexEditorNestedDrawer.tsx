import type {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  UISchemaElement,
} from "@jsonforms/core"
import { Box, Stack, VStack } from "@chakra-ui/react"
import { JsonFormsDispatch } from "@jsonforms/react"
import { Button } from "@opengovsg/oui"
import { BiLeftArrowAlt, BiRightArrowAlt, BiTrash } from "react-icons/bi"
import { IconButton } from "~/components/oui-bridge/IconButton"

import { DrawerHeader } from "../../Drawer/DrawerHeader"

interface ComplexEditorNestedDrawerProps {
  renderers?: JsonFormsRendererRegistryEntry[]
  cells?: JsonFormsCellRendererRegistryEntry[]
  visible: boolean
  schema: JsonSchema
  uischema: UISchemaElement
  path: string
  label: string
  setSelectedIndex: (selectedIndex?: number) => void
  selectedIndex: number
  maxIndex: number
  isRemoveItemDisabled: boolean
  handleRemoveItem: () => void
}

export function ComplexEditorNestedDrawer({
  renderers,
  cells,
  visible,
  schema,
  uischema,
  path,
  label,
  setSelectedIndex,
  isRemoveItemDisabled,
  handleRemoveItem,
  selectedIndex,
  maxIndex,
}: ComplexEditorNestedDrawerProps) {
  return (
    <VStack
      position="absolute"
      top={0}
      left={0}
      bg="grey.50"
      w="100%"
      h="100%"
      zIndex={1}
      gap={0}
    >
      <DrawerHeader
        label={`Edit ${label}`}
        onBackClick={() => setSelectedIndex()}
        textStyle="subhead-1"
        backAriaLabel={`Return to ${label}`}
      />
      <Box w="100%" h="100%" px="1.5rem" py="1rem" flex={1} overflow="auto">
        <JsonFormsDispatch
          renderers={renderers}
          cells={cells}
          visible={visible}
          schema={schema}
          uischema={uischema}
          path={path}
        />
      </Box>
      <Stack
        flexDirection="row"
        bg="base.canvas.default"
        boxShadow="md"
        py="1.5rem"
        px="2rem"
        w="full"
      >
        <IconButton
          icon={<BiTrash fontSize="1.25rem" />}
          variant="outline"
          color="critical"
          onPress={handleRemoveItem}
          isDisabled={isRemoveItemDisabled}
          aria-label="Remove item"
        />
        <Stack flexDirection="row" flex={1}>
          <Button
            startContent={<BiLeftArrowAlt fontSize="1.25rem" />}
            className="flex-1"
            variant="outline"
            isDisabled={selectedIndex === 0}
            onPress={() => setSelectedIndex(Math.max(selectedIndex - 1, 0))}
          >
            Previous
          </Button>
          <Button
            endContent={<BiRightArrowAlt fontSize="1.25rem" />}
            className="flex-1"
            variant="outline"
            isDisabled={selectedIndex === maxIndex}
            onPress={() =>
              setSelectedIndex(Math.min(selectedIndex + 1, maxIndex))
            }
          >
            Next
          </Button>
        </Stack>
      </Stack>
    </VStack>
  )
}
