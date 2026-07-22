import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import {
  and,
  composePaths,
  createDefaultValue,
  hasType,
  isObjectArrayControl,
  isPrimitiveArrayControl,
  or,
  rankWith,
  schemaMatches,
  schemaSubPathMatches,
  uiTypeIs,
} from "@jsonforms/core"
import { withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { AddItemButton } from "../../components/AddItemButton"
import { DraggableTagButton } from "../../components/DraggableTagButton"
import { EmptyArray } from "../../components/EmptyArray"
import { NestedDrawerSwitch } from "../../components/NestedDrawerSwitch"
import { useBuilderErrors } from "../../ErrorProvider"
import { useArray } from "../../hooks/useArray"
import { useCanvasPreviewClickToEdit } from "../../hooks/useCanvasPreviewClickToEdit"

// The built-in isObjectArrayControl only accepts items with type "object",
// so arrays of a union of components (e.g. canvas blocks) need this variant.
// Items must be inline object schemas — unions of $refs (e.g. prose content)
// are excluded so they keep falling through to their dedicated controls.
const isAnyOfObjectArrayControl = and(
  uiTypeIs("Control"),
  schemaMatches(
    (schema) => hasType(schema, "array") && !Array.isArray(schema.items),
  ),
  schemaSubPathMatches(
    "items",
    (schema) =>
      !!schema.anyOf &&
      schema.anyOf.length > 0 &&
      schema.anyOf.every((subschema) => hasType(subschema, "object")),
  ),
)

export const jsonFormsArrayControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ArrayControl,
  or(isObjectArrayControl, isPrimitiveArrayControl, isAnyOfObjectArrayControl),
)

function JsonFormsArrayControl(props: ArrayLayoutProps) {
  const {
    data,
    path,
    enabled,
    label,
    addItem,
    arraySchema,
    schema,
    rootSchema,
    uischemas,
    uischema,
    removeItems,
    moveUp,
    moveDown,
    description,
  } = props
  const { hasErrorAt } = useBuilderErrors()
  const arrayResult = useArray({
    data,
    path,
    arraySchema,
    schema,
    rootSchema,
    uischemas,
    uischema,
    removeItems,
    moveUp,
    moveDown,
  })
  const {
    selectedIndex,
    setSelectedIndex,
    isAddItemDisabled,
    childUiSchema,
    handleRemoveSelectedItem,
    onDragEnd,
  } = arrayResult

  // Canvas blocks can be selected by clicking them on the live preview,
  // removed with the Delete key, duplicated with ⌘D/Ctrl+D, and moved
  // forward/backward in the stacking order with ⌘]/⌘[; hovering a block's
  // row below highlights it on the preview, Shift+clicking a row toggles
  // its block in the Wix-style multi-selection, and right-clicking a row
  // opens the block or group context menu. For every other array this is
  // a no-op
  const {
    setHoveredListBlockIndex,
    isCanvasBlocksList,
    multiSelectedIndices,
    toggleMultiSelectedBlock,
    openListBlockContextMenu,
  } = useCanvasPreviewClickToEdit({
    path,
    selectedIndex,
    setSelectedIndex,
    removeSelectedItem: handleRemoveSelectedItem,
    addItem,
    moveUp,
    moveDown,
    removeItems,
  })

  return (
    <NestedDrawerSwitch {...props} {...arrayResult}>
      <VStack spacing={0} align="start">
        <VStack align="start" spacing="0.25rem" w="full">
          <HStack w="full" justifyContent="space-between" align="center">
            <Text textStyle="subhead-1" flex={1}>
              {label}
            </Text>
            <AddItemButton
              onClick={addItem(path, createDefaultValue(schema, rootSchema))}
              isDisabled={isAddItemDisabled}
            >
              Add item
            </AddItemButton>
          </HStack>
          {description && (
            <Text textStyle="body-2" textColor="base.content.default">
              {description}
            </Text>
          )}
        </VStack>
        <Box w="full" mt={description ? "0.75rem" : "0.25rem"}>
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
                  {data === 0 && <EmptyArray />}

                  {[...Array(data).keys()].map((index) => {
                    const childPath = composePaths(path, `${index}`)
                    const hasError = hasErrorAt(childPath)
                    const isMultiSelected =
                      isCanvasBlocksList && multiSelectedIndices.includes(index)

                    return (
                      <Draggable
                        key={childPath}
                        draggableId={childPath}
                        disableInteractiveElementBlocking
                        index={index}
                      >
                        {({ draggableProps, dragHandleProps, innerRef }) => (
                          <DraggableTagButton.Root
                            draggableProps={draggableProps}
                            isError={hasError}
                            isSelected={isMultiSelected}
                            ref={innerRef}
                            onMouseEnter={() => setHoveredListBlockIndex(index)}
                            onMouseLeave={() => setHoveredListBlockIndex(null)}
                            onContextMenu={(event) => {
                              // Right-click mirrors the preview's Wix-style
                              // context menu from the block list
                              if (!isCanvasBlocksList) {
                                return
                              }
                              event.preventDefault()
                              openListBlockContextMenu(index, {
                                clientX: event.clientX,
                                clientY: event.clientY,
                              })
                            }}
                          >
                            <DraggableTagButton.Handle
                              dragHandleProps={dragHandleProps}
                              py={hasError ? "0.75rem" : "1.25rem"}
                            />
                            <DraggableTagButton.Body
                              onClick={(event) => {
                                // Shift+click mirrors the preview's Wix-style
                                // multi-selection toggle from the block list
                                if (isCanvasBlocksList && event.shiftKey) {
                                  toggleMultiSelectedBlock(index)
                                  return
                                }
                                setSelectedIndex(index)
                              }}
                              isPressed={
                                isCanvasBlocksList ? isMultiSelected : undefined
                              }
                              py={hasError ? "0.75rem" : "1rem"}
                            >
                              <DraggableTagButton.Content>
                                <DraggableTagButton.Label
                                  index={index}
                                  path={path}
                                  schema={schema}
                                  uischema={childUiSchema}
                                  enabled={enabled}
                                  removeItem={handleRemoveSelectedItem}
                                />
                                {hasError && (
                                  <DraggableTagButton.ErrorCaption />
                                )}
                              </DraggableTagButton.Content>
                            </DraggableTagButton.Body>
                          </DraggableTagButton.Root>
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
    </NestedDrawerSwitch>
  )
}

export default withJsonFormsArrayLayoutProps(JsonFormsArrayControl)
