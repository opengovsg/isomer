import type {
  ArrayLayoutProps,
  JsonSchema,
  RankedTester,
} from "@jsonforms/core"
import type { IsomerComponent } from "@opengovsg/isomer-components"
import { Box, HStack, Icon, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import {
  composePaths,
  Generate,
  rankWith,
  Resolve,
  schemaMatches,
} from "@jsonforms/core"
import {
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsArrayLayoutProps,
} from "@jsonforms/react"
import { Button } from "@opengovsg/design-system-react"
import {
  BLOCK_LIST_FORMAT,
  getComponentSchema,
} from "@opengovsg/isomer-components"
import { cloneDeep } from "lodash-es"
import { useMemo, useState } from "react"
import {
  BiChevronDown,
  BiChevronRight,
  BiChevronUp,
  BiColumns,
  BiTrash,
  BiX,
} from "react-icons/bi"
import {
  ACCORDION_ALLOWED_BLOCKS,
  DEFAULT_BLOCKS,
} from "~/components/PageEditor/constants"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import {
  BaseBlock,
  BaseBlockDragHandle,
} from "~/features/editing-experience/components/Block/BaseBlock"

import { AddItemButton } from "../../components/AddItemButton"
import { EmptyArray } from "../../components/EmptyArray"
import { NestedBlockDrawer } from "../../components/NestedBlockDrawer"
import { NestedBlockPicker } from "../../components/NestedBlockPicker"
import { NestedBlockRow } from "../../components/NestedBlockRow"
import { useBuilderErrors } from "../../ErrorProvider"
import { useArray } from "../../hooks/useArray"

export const jsonFormsBlockListControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.BlockListControl,
  schemaMatches((schema) => schema.format === BLOCK_LIST_FORMAT),
)

const PARENT_LABEL = "Accordion"

/**
 * The list of child blocks inside a container block (today: an Accordion).
 * Content blocks open in a nested drawer; a Column expands in place so its
 * layout and slots can be edited without leaving the list.
 */
function JsonFormsBlockListControl(props: ArrayLayoutProps) {
  const {
    data,
    path,
    label,
    description,
    required,
    addItem,
    removeItems,
    renderers,
    cells,
  } = props
  const { hasErrorAt } = useBuilderErrors()
  const { core } = useJsonForms()
  const { isAddItemDisabled, onDragEnd } = useArray(props)

  // Index of the block open in the nested drawer, if any.
  const [selectedIndex, setSelectedIndex] = useState<number>()
  // Index of the Column block expanded in place, if any.
  const [expandedIndex, setExpandedIndex] = useState<number>()
  const [isPickerOpen, setIsPickerOpen] = useState(false)

  const blocks =
    (Resolve.data(core?.data, path) as IsomerComponent[] | undefined) ?? []

  // A Column inside a container never offers three equal columns, which is
  // what getComponentSchema returns when no layout is given.
  // JsonFormsDispatch falls back to the root form's UI schema when none is
  // given, so one is generated for the column schema here.
  const { columnSchema, columnUiSchema } = useMemo(() => {
    const schema = getComponentSchema({ component: "column" }) as JsonSchema
    return {
      columnSchema: schema,
      columnUiSchema: Generate.uiSchema(schema, "VerticalLayout"),
    }
  }, [])

  const handleAdd = (type: IsomerComponent["type"]) => {
    const block = DEFAULT_BLOCKS[type] as IsomerComponent | undefined
    if (!block) return

    addItem(path, cloneDeep(block))()
    setIsPickerOpen(false)
    // `data` is the current item count, so it is the new block's index.
    if (type === "column") {
      setExpandedIndex(data)
    } else {
      setSelectedIndex(data)
    }
  }

  const handleRemove = (index: number) => {
    removeItems?.(path, [index])()
    setSelectedIndex(undefined)
    setExpandedIndex(undefined)
  }

  const selectedBlock =
    selectedIndex === undefined ? undefined : blocks[selectedIndex]

  return (
    <>
      <VStack spacing={0} align="start" w="full">
        <VStack align="start" spacing="0.25rem" w="full">
          <HStack w="full" justifyContent="space-between" align="center">
            <HStack spacing="0.25rem">
              <Text textStyle="subhead-1">{label}</Text>
              {required && (
                <Text textStyle="subhead-1" color="utility.feedback.critical">
                  *
                </Text>
              )}
            </HStack>
            {isPickerOpen ? (
              <Button
                variant="clear"
                size="xs"
                leftIcon={<BiX fontSize="1.25rem" />}
                onClick={() => setIsPickerOpen(false)}
              >
                Cancel
              </Button>
            ) : (
              <AddItemButton
                onClick={() => setIsPickerOpen(true)}
                isDisabled={isAddItemDisabled}
              >
                Add block
              </AddItemButton>
            )}
          </HStack>
          {description && (
            <Text textStyle="body-2" textColor="base.content.default">
              {description}
            </Text>
          )}
        </VStack>

        <Box w="full" mt="0.75rem">
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId={path}>
              {({ droppableProps, innerRef, placeholder }) => (
                <VStack
                  {...droppableProps}
                  align="stretch"
                  w="100%"
                  spacing={0}
                  ref={innerRef}
                >
                  {data === 0 && !isPickerOpen && <EmptyArray />}

                  {blocks.map((block, index) => {
                    const childPath = composePaths(path, `${index}`)
                    const hasError = hasErrorAt(childPath)
                    const isExpandedColumn =
                      block.type === "column" && expandedIndex === index

                    return (
                      <Draggable
                        key={childPath}
                        draggableId={childPath}
                        disableInteractiveElementBlocking
                        index={index}
                      >
                        {(provided, snapshot) => {
                          const dragHandle = (
                            <BaseBlockDragHandle
                              isDragging={
                                snapshot.isDragging || snapshot.isDropAnimating
                              }
                              {...provided.dragHandleProps}
                            />
                          )

                          return (
                            <VStack
                              ref={provided.innerRef}
                              {...provided.draggableProps}
                              my="0.25rem"
                              w="100%"
                              spacing={0}
                              align="stretch"
                            >
                              {isExpandedColumn ? (
                                <Box
                                  border="1px solid"
                                  borderColor="interaction.main-subtle.hover"
                                  borderRadius="6px"
                                  overflow="hidden"
                                  boxShadow="0px 1px 6px 0px #1361F026"
                                >
                                  <BaseBlock
                                    icon={BiColumns}
                                    label="Column"
                                    dragHandle={dragHandle}
                                    onClick={() => setExpandedIndex(undefined)}
                                    trailing={
                                      <Icon
                                        as={BiChevronUp}
                                        fontSize="1.25rem"
                                        color="base.content.medium"
                                        aria-hidden
                                      />
                                    }
                                    containerProps={{
                                      border: "none",
                                      borderRadius: 0,
                                      bg: "base.canvas.brand-subtle",
                                      _hover: {
                                        bg: "base.canvas.brand-subtle",
                                      },
                                    }}
                                  />
                                  <VStack
                                    align="stretch"
                                    spacing="1rem"
                                    p="1rem"
                                    borderTop="1px solid"
                                    borderColor="interaction.main-subtle.default"
                                  >
                                    <JsonFormsDispatch
                                      renderers={renderers}
                                      cells={cells}
                                      visible
                                      schema={columnSchema}
                                      uischema={columnUiSchema}
                                      path={childPath}
                                    />
                                    <Button
                                      alignSelf="start"
                                      variant="clear"
                                      colorScheme="critical"
                                      size="xs"
                                      leftIcon={<BiTrash fontSize="1rem" />}
                                      onClick={() => handleRemove(index)}
                                    >
                                      Remove column block
                                    </Button>
                                  </VStack>
                                </Box>
                              ) : (
                                <NestedBlockRow
                                  block={block}
                                  isError={hasError}
                                  dragHandle={dragHandle}
                                  trailingIcon={
                                    block.type === "column"
                                      ? BiChevronDown
                                      : BiChevronRight
                                  }
                                  onClick={() =>
                                    block.type === "column"
                                      ? setExpandedIndex(index)
                                      : setSelectedIndex(index)
                                  }
                                />
                              )}
                            </VStack>
                          )
                        }}
                      </Draggable>
                    )
                  })}

                  {placeholder}
                </VStack>
              )}
            </Droppable>
          </DragDropContext>

          {isPickerOpen && (
            <Box my="0.25rem">
              <NestedBlockPicker
                allowedTypes={ACCORDION_ALLOWED_BLOCKS}
                onSelect={handleAdd}
              />
            </Box>
          )}
        </Box>
      </VStack>

      {selectedIndex !== undefined && selectedBlock && (
        <NestedBlockDrawer
          path={composePaths(path, `${selectedIndex}`)}
          block={selectedBlock}
          parentLabel={PARENT_LABEL}
          breadcrumb={PARENT_LABEL}
          onBack={() => setSelectedIndex(undefined)}
          onDelete={() => handleRemove(selectedIndex)}
          renderers={renderers}
          cells={cells}
        />
      )}
    </>
  )
}

export default withJsonFormsArrayLayoutProps(JsonFormsBlockListControl)
