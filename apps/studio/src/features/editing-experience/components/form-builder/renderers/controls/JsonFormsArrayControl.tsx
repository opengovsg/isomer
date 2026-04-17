import type { BoxProps } from "@chakra-ui/react"
import type { DropResult } from "@hello-pangea/dnd"
import type {
  ArrayLayoutProps,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  RankedTester,
  UISchemaElement,
} from "@jsonforms/core"
import type { ReactNode } from "react"
import type { IconType } from "react-icons"
import { Box, Flex, HStack, Stack, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import {
  composePaths,
  createDefaultValue,
  findUISchema,
  isObjectArrayControl,
  isPrimitiveArrayControl,
  or,
  rankWith,
} from "@jsonforms/core"
import {
  JsonFormsDispatch,
  withJsonFormsArrayLayoutProps,
} from "@jsonforms/react"
import { Button, IconButton } from "@opengovsg/design-system-react"
import { useCallback, useMemo, useState } from "react"
import {
  BiLeftArrowAlt,
  BiPlusCircle,
  BiRightArrowAlt,
  BiTrash,
} from "react-icons/bi"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { DrawerHeader } from "../../../Drawer/DrawerHeader"
import { useBuilderErrors } from "../../ErrorProvider"
import DraggableDrawerButton from "./DraggableDrawerButton"

export const jsonFormsArrayControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ArrayControl,
  or(isObjectArrayControl, isPrimitiveArrayControl),
)

export type JsonFormsArrayControlProps = ArrayLayoutProps & {
  listItemIcon?: IconType
  /** When the array is empty, replaces the default placeholder inside the empty-state container. */
  emptyState?: ReactNode
  /** Merged into row padding on the drag handle and label button (after defaults). */
  listItemContentProps?: BoxProps
  /** Per-row content after the label (e.g. actions menu), flush right in the row. */
  renderListItemTrailing?: (index: number) => ReactNode
  /** Caption under the list item title (e.g. option counts). */
  renderListItemSubtitle?: (index: number) => ReactNode
  /** Rendered after the schema description and before the draggable list. */
  belowDescription?: ReactNode
}

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

function ComplexEditorNestedDrawer({
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
          colorScheme="critical"
          onClick={handleRemoveItem}
          isDisabled={isRemoveItemDisabled}
          aria-label="Remove item"
        />
        <Stack flexDirection="row" flex={1}>
          <Button
            leftIcon={<BiLeftArrowAlt fontSize="1.25rem" />}
            flex={1}
            variant="outline"
            isDisabled={selectedIndex === 0}
            onClick={() => setSelectedIndex(Math.max(selectedIndex - 1, 0))}
          >
            Previous
          </Button>
          <Button
            rightIcon={<BiRightArrowAlt fontSize="1.25rem" />}
            flex={1}
            variant="outline"
            isDisabled={selectedIndex === maxIndex}
            onClick={() =>
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

export function JsonFormsArrayControlView({
  data,
  path,
  visible,
  enabled,
  label,
  addItem,
  removeItems,
  moveUp,
  moveDown,
  arraySchema,
  schema,
  rootSchema,
  renderers,
  cells,
  uischemas,
  uischema,
  description,
  listItemIcon,
  emptyState,
  listItemContentProps,
  renderListItemTrailing,
  renderListItemSubtitle,
  belowDescription,
}: JsonFormsArrayControlProps) {
  const { hasErrorAt } = useBuilderErrors()
  const arraySchemaWithExtensions = arraySchema as JsonSchema & {
    addItemLabel?: string
  }
  const addItemLabel = arraySchemaWithExtensions.addItemLabel ?? "Add item"
  const [selectedIndex, setSelectedIndex] = useState<number>()
  const isRemoveItemDisabled =
    arraySchema.minItems !== undefined && data <= arraySchema.minItems
  const handleRemoveItem = useCallback(
    (path: string, index: number) => () => {
      if (selectedIndex === undefined || !removeItems || isRemoveItemDisabled) {
        return
      }

      removeItems(path, [index])()

      if (selectedIndex === index) {
        setSelectedIndex(undefined)
      } else if (selectedIndex > index) {
        setSelectedIndex(selectedIndex - 1)
      }
    },
    [isRemoveItemDisabled, removeItems, selectedIndex],
  )
  const handleMoveItem = useCallback(
    (path: string, originalIndex: number, newIndex: number) => {
      if (originalIndex === newIndex || !moveDown || !moveUp) {
        return
      }

      if (originalIndex < newIndex) {
        for (let i = originalIndex; i < newIndex; i++) {
          moveDown(path, i)()
        }
      } else {
        for (let i = originalIndex; i > newIndex; i--) {
          moveUp(path, i)()
        }
      }
    },
    [moveUp, moveDown],
  )

  const childUiSchema = useMemo(
    () =>
      findUISchema(
        uischemas ?? [],
        schema,
        uischema.scope,
        path,
        undefined,
        uischema,
        rootSchema,
      ),
    [uischemas, schema, uischema, path, rootSchema],
  )
  const onDragEnd = (result: DropResult) => {
    if (!result.destination) {
      return
    }
    const originalIndex = result.source.index
    const newIndex = result.destination.index
    handleMoveItem(path, originalIndex, newIndex)
  }

  if (selectedIndex !== undefined) {
    return (
      <ComplexEditorNestedDrawer
        renderers={renderers}
        cells={cells}
        visible={visible}
        schema={schema}
        uischema={childUiSchema}
        path={composePaths(path, `${selectedIndex}`)}
        label={label}
        setSelectedIndex={setSelectedIndex}
        isRemoveItemDisabled={isRemoveItemDisabled}
        handleRemoveItem={handleRemoveItem(path, selectedIndex)}
        selectedIndex={selectedIndex}
        maxIndex={data - 1}
      />
    )
  }

  return (
    <VStack spacing={0} align="start">
      <VStack align="start" spacing="0.25rem" w="full">
        <HStack w="full" justifyContent="space-between" align="center">
          <Text textStyle="subhead-1" flex={1}>
            {label}
          </Text>
          <Button
            onClick={addItem(path, createDefaultValue(schema, rootSchema))}
            variant="clear"
            size="xs"
            leftIcon={<BiPlusCircle fontSize="1.25rem" />}
            isDisabled={
              arraySchema.maxItems !== undefined && data >= arraySchema.maxItems
            }
            flexShrink={0}
          >
            {addItemLabel}
          </Button>
        </HStack>
        {description && (
          <Text textStyle="body-2" textColor="base.content.default">
            {description}
          </Text>
        )}
        {belowDescription}
      </VStack>
      <Box
        w="full"
        mt={description || belowDescription ? "0.75rem" : "0.25rem"}
      >
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="blocks">
            {({ droppableProps, innerRef, placeholder }) => (
              <VStack
                {...droppableProps}
                align="baseline"
                w="100%"
                h="100%"
                spacing={0}
                ref={innerRef}
              >
                {data === 0 && (
                  <Flex
                    alignItems="center"
                    flexDir="column"
                    px="1.5rem"
                    py="3.75rem"
                    mt="0.25rem"
                    justifyContent="center"
                    w="100%"
                  >
                    {emptyState ?? (
                      <Text
                        textStyle="subhead-1"
                        textColor="base.content.default"
                        textAlign="center"
                      >
                        Items you add will appear here
                      </Text>
                    )}
                  </Flex>
                )}

                {[...Array(data).keys()].map((index) => {
                  const childPath = composePaths(path, `${index}`)
                  const hasError = hasErrorAt(childPath)

                  return (
                    <Draggable
                      key={childPath}
                      draggableId={childPath}
                      disableInteractiveElementBlocking
                      index={index}
                    >
                      {({ draggableProps, dragHandleProps, innerRef }) => (
                        <DraggableDrawerButton
                          draggableProps={draggableProps}
                          dragHandleProps={dragHandleProps}
                          isError={hasError}
                          ref={innerRef}
                          index={index}
                          path={path}
                          schema={schema}
                          enabled={enabled}
                          handleSelect={() => () => undefined}
                          removeItem={handleRemoveItem}
                          selected={false}
                          key={index}
                          uischema={childUiSchema}
                          childLabelProp={undefined}
                          translations={{}}
                          setSelectedIndex={setSelectedIndex}
                          listItemIcon={listItemIcon}
                          listItemContentProps={listItemContentProps}
                          listItemTrailing={renderListItemTrailing?.(index)}
                          listItemSubtitle={renderListItemSubtitle?.(index)}
                        />
                      )}
                    </Draggable>
                  )
                })}

                {placeholder}
              </VStack>
            )}
          </Droppable>
        </DragDropContext>
      </Box>
    </VStack>
  )
}

function JsonFormsArrayControl(props: ArrayLayoutProps) {
  return <JsonFormsArrayControlView {...props} />
}

export default withJsonFormsArrayLayoutProps(JsonFormsArrayControl)
