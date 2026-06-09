import type { DropResult } from "@hello-pangea/dnd"
import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import { Flex, Stack, Text, VStack } from "@chakra-ui/react"
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
import { withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { Button } from "@opengovsg/design-system-react"
import { useCallback, useMemo, useState } from "react"
import { BiPlusCircle } from "react-icons/bi"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { ComplexEditorNestedDrawer } from "../../components/ComplexEditorNestedDrawer"
import { useBuilderErrors } from "../../ErrorProvider"
import DraggableDrawerButton from "../../components/DraggableDrawerButton"

export const jsonFormsArrayControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ArrayControl,
  or(isObjectArrayControl, isPrimitiveArrayControl),
)
function JsonFormsArrayControl({
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
}: ArrayLayoutProps) {
  const { hasErrorAt } = useBuilderErrors()
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
    <VStack spacing="0.375rem" align="start">
      <Stack flexDir="row" justify="space-between" align="center" w="full">
        <Text textStyle="subhead-1">{label}</Text>
        <Button
          onClick={addItem(path, createDefaultValue(schema, rootSchema))}
          variant="clear"
          size="xs"
          leftIcon={<BiPlusCircle fontSize="1.25rem" />}
          isDisabled={
            arraySchema.maxItems !== undefined && data >= arraySchema.maxItems
          }
        >
          Add item
        </Button>
      </Stack>
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
              mt="-0.25rem"
            >
              {data === 0 && (
                <Flex
                  alignItems="center"
                  flexDir="column"
                  px="1.5rem"
                  p="3.75rem"
                  mt="0.25rem"
                  justifyContent="center"
                  w="100%"
                >
                  <Text
                    textStyle="subhead-1"
                    textColor="base.content.default"
                    textAlign="center"
                  >
                    Items you add will appear here
                  </Text>
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
    </VStack>
  )
}

export default withJsonFormsArrayLayoutProps(JsonFormsArrayControl)
