import type {
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  UISchemaElement,
} from "@jsonforms/core"
import type { IsomerComponent } from "@opengovsg/isomer-components"
import { Box, Stack, VStack } from "@chakra-ui/react"
import { Generate } from "@jsonforms/core"
import { JsonFormsDispatch } from "@jsonforms/react"
import { Button, IconButton } from "@opengovsg/design-system-react"
import { getComponentSchema, ProseSchema } from "@opengovsg/isomer-components"
import { useMemo } from "react"
import { BiChevronLeft, BiTrash } from "react-icons/bi"
import { BLOCK_TO_META } from "~/components/PageEditor/constants"

import { DrawerHeader } from "../../Drawer/DrawerHeader"

// A prose block is a single control (the rich text editor) rather than an
// object with fields, so it is dispatched as one control at the block's path.
const PROSE_UI_SCHEMA: UISchemaElement = { type: "Control", scope: "#" }

interface NestedBlockDrawerProps {
  // JSON Forms path of the block being edited, relative to the form root.
  path: string
  block: IsomerComponent
  // What the back button returns to, e.g. "Accordion".
  parentLabel: string
  // Where the block sits, shown under the title, e.g. "Accordion › Column 1".
  breadcrumb?: string
  onBack: () => void
  onDelete: () => void
  renderers?: JsonFormsRendererRegistryEntry[]
  cells?: JsonFormsCellRendererRegistryEntry[]
}

/**
 * Edits a block that lives inside a container block, as an overlay on top of
 * the parent block's drawer. Edits flow through the same JSON Forms instance,
 * so the parent's "Save block" persists them and its "Discard" drops them.
 */
export const NestedBlockDrawer = ({
  path,
  block,
  parentLabel,
  breadcrumb,
  onBack,
  onDelete,
  renderers,
  cells,
}: NestedBlockDrawerProps) => {
  const label = BLOCK_TO_META[block.type].label

  // Memoised so the schema identity is stable across renders; see the note
  // in ComplexEditorStateDrawer.
  const { schema, uischema } = useMemo(() => {
    if (block.type === "prose") {
      return {
        schema: ProseSchema,
        uischema: PROSE_UI_SCHEMA,
      }
    }
    // Blocks inside a container always get their non-homepage variant, so no
    // page layout is passed here. JsonFormsDispatch falls back to the root
    // form's UI schema when none is given, so one is generated for the block.
    const blockSchema = getComponentSchema({
      component: block.type,
    }) as JsonSchema
    return {
      schema: blockSchema,
      uischema: Generate.uiSchema(blockSchema, "VerticalLayout"),
    }
  }, [block.type])

  return (
    <VStack
      role="dialog"
      aria-label={`Edit ${label}`}
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
        description={breadcrumb}
        onBackClick={onBack}
        textStyle="subhead-1"
        backAriaLabel={`Back to ${parentLabel}`}
      />
      <Box w="100%" px="1.5rem" py="1rem" flex={1} minH={0} overflow="auto">
        <JsonFormsDispatch
          renderers={renderers}
          cells={cells}
          visible
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
        flexShrink={0}
      >
        <IconButton
          icon={<BiTrash fontSize="1.25rem" />}
          variant="outline"
          colorScheme="critical"
          onClick={onDelete}
          aria-label={`Remove ${label}`}
        />
        <Button
          leftIcon={<BiChevronLeft fontSize="1.25rem" />}
          flex={1}
          variant="outline"
          onClick={onBack}
        >
          Back to {parentLabel}
        </Button>
      </Stack>
    </VStack>
  )
}
