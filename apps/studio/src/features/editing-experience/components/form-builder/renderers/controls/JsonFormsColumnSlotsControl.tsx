import type { ControlProps, RankedTester } from "@jsonforms/core"
import type {
  ColumnLayout,
  ContainerContentBlock,
  IsomerComponent,
} from "@opengovsg/isomer-components"
import type { ColumnBlock } from "~/features/editing-experience/utils"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { composePaths, rankWith, Resolve, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsControlProps } from "@jsonforms/react"
import { Button } from "@opengovsg/design-system-react"
import {
  COLUMN_SLOTS_FORMAT,
  DEFAULT_COLUMN_LAYOUT,
} from "@opengovsg/isomer-components"
import { cloneDeep } from "lodash-es"
import { useState } from "react"
import { BiChevronRight, BiX } from "react-icons/bi"
import {
  COLUMN_ALLOWED_BLOCKS,
  DEFAULT_BLOCKS,
} from "~/components/PageEditor/constants"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { resizeColumns } from "~/features/editing-experience/utils"

import { AddItemButton } from "../../components/AddItemButton"
import { NestedBlockDrawer } from "../../components/NestedBlockDrawer"
import { NestedBlockPicker } from "../../components/NestedBlockPicker"
import { NestedBlockRow } from "../../components/NestedBlockRow"
import { useBuilderErrors } from "../../ErrorProvider"

export const jsonFormsColumnSlotsControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ColumnSlotsControl,
  schemaMatches((schema) => schema.format === COLUMN_SLOTS_FORMAT),
)

const PARENT_LABEL = "Column"

const getColumnLabel = (index: number) => `Column ${index + 1}`

/**
 * The slots of a Column block: one per column, each holding at most one
 * content block. An empty slot offers the in-place picker; a filled slot
 * opens the block in a nested drawer.
 */
function JsonFormsColumnSlotsControl({
  data,
  path,
  handleChange,
  renderers,
  cells,
}: ControlProps): JSX.Element {
  const { hasErrorAt } = useBuilderErrors()
  const { core } = useJsonForms()

  // Index of the slot whose picker is open, if any.
  const [pickerIndex, setPickerIndex] = useState<number>()
  // Index of the slot whose block is open in the nested drawer, if any.
  const [selectedIndex, setSelectedIndex] = useState<number>()

  // The number of slots follows the sibling `variant`, so a layout change
  // that has not been written back yet still shows the right count.
  const variantPath = composePaths(
    path.split(".").slice(0, -1).join("."),
    "variant",
  )
  const variant =
    (Resolve.data(core?.data, variantPath) as ColumnLayout | undefined) ??
    DEFAULT_COLUMN_LAYOUT
  const columns = resizeColumns(
    (data as ColumnBlock["columns"] | undefined) ?? [],
    variant,
  )

  const setSlot = (index: number, slot: ColumnBlock["columns"][number]) => {
    const updatedColumns = Array.from(columns)
    updatedColumns[index] = slot
    handleChange(path, updatedColumns)
  }

  const handleAdd = (index: number, type: IsomerComponent["type"]) => {
    // The picker only offers COLUMN_ALLOWED_BLOCKS, all of which are
    // container content blocks.
    const block = DEFAULT_BLOCKS[type] as ContainerContentBlock | undefined
    if (!block) return

    setSlot(index, [cloneDeep(block)])
    setPickerIndex(undefined)
    setSelectedIndex(index)
  }

  const selectedBlock =
    selectedIndex === undefined ? undefined : columns[selectedIndex]?.[0]

  return (
    <>
      <VStack align="stretch" spacing="1rem" w="full">
        {columns.map((slot, index) => {
          const block = slot[0]
          const blockPath = composePaths(composePaths(path, `${index}`), "0")
          const isPickerOpen = pickerIndex === index

          return (
            <VStack key={index} align="stretch" spacing="0.25rem">
              <HStack justifyContent="space-between" align="center">
                <Text
                  textStyle="caption-1"
                  color="base.content.medium"
                  textTransform="uppercase"
                  letterSpacing="0.08em"
                >
                  {getColumnLabel(index)}
                </Text>
                {block === undefined &&
                  (isPickerOpen ? (
                    <Button
                      variant="clear"
                      size="xs"
                      leftIcon={<BiX fontSize="1rem" />}
                      onClick={() => setPickerIndex(undefined)}
                    >
                      Cancel
                    </Button>
                  ) : (
                    <AddItemButton onClick={() => setPickerIndex(index)}>
                      Add block
                    </AddItemButton>
                  ))}
              </HStack>

              {block !== undefined ? (
                <NestedBlockRow
                  block={block}
                  isError={hasErrorAt(blockPath)}
                  trailingIcon={BiChevronRight}
                  onClick={() => setSelectedIndex(index)}
                />
              ) : isPickerOpen ? (
                <NestedBlockPicker
                  allowedTypes={COLUMN_ALLOWED_BLOCKS}
                  onSelect={(type) => handleAdd(index, type)}
                />
              ) : (
                <Box
                  px="0.75rem"
                  py="1rem"
                  border="1px dashed"
                  borderColor="base.divider.strong"
                  borderRadius="6px"
                >
                  <Text
                    textStyle="caption-2"
                    color="base.content.medium"
                    textAlign="center"
                  >
                    No block in this column yet
                  </Text>
                </Box>
              )}
            </VStack>
          )
        })}
      </VStack>

      {selectedIndex !== undefined && selectedBlock !== undefined && (
        <NestedBlockDrawer
          path={composePaths(composePaths(path, `${selectedIndex}`), "0")}
          block={selectedBlock}
          parentLabel={PARENT_LABEL}
          breadcrumb={`${PARENT_LABEL} › ${getColumnLabel(selectedIndex)}`}
          onBack={() => setSelectedIndex(undefined)}
          onDelete={() => {
            setSlot(selectedIndex, [])
            setSelectedIndex(undefined)
          }}
          renderers={renderers}
          cells={cells}
        />
      )}
    </>
  )
}

export default withJsonFormsControlProps(JsonFormsColumnSlotsControl)
