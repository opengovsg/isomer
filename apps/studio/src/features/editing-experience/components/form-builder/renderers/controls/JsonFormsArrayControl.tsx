import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import { Stack, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import {
  composePaths,
  createDefaultValue,
  isObjectArrayControl,
  isPrimitiveArrayControl,
  or,
  rankWith,
} from "@jsonforms/core"
import { withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { AddItemButton } from "../../components/AddItemButton"
import { DraggableTagButton } from "../../components/DraggableTagButton"
import { EmptyArray } from "../../components/EmptyArray"
import { NestedDrawerProvider } from "../../components/NestedDrawerProvider"
import { useBuilderErrors } from "../../ErrorProvider"
import { useArray } from "../../hooks/useArray"

export const jsonFormsArrayControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ArrayControl,
  or(isObjectArrayControl, isPrimitiveArrayControl),
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
    setSelectedIndex,
    isAddItemDisabled,
    childUiSchema,
    handleRemoveItem,
    onDragEnd,
  } = arrayResult

  return (
    <NestedDrawerProvider {...props} {...arrayResult}>
      <VStack spacing="0.375rem" align="start">
        <Stack flexDir="row" justify="space-between" align="center" w="full">
          <Text textStyle="subhead-1">{label}</Text>
          <AddItemButton
            onClick={addItem(path, createDefaultValue(schema, rootSchema))}
            isDisabled={isAddItemDisabled}
          >
            Add item
          </AddItemButton>
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
                {data === 0 && <EmptyArray />}

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
                        <DraggableTagButton.Root
                          draggableProps={draggableProps}
                          isError={hasError}
                          ref={innerRef}
                        >
                          <DraggableTagButton.Handle
                            dragHandleProps={dragHandleProps}
                          />
                          <DraggableTagButton.Body
                            onClick={() => setSelectedIndex(index)}
                          >
                            <DraggableTagButton.Content>
                              <DraggableTagButton.Label
                                index={index}
                                path={path}
                                schema={schema}
                                uischema={childUiSchema}
                                enabled={enabled}
                                handleSelect={() => () => undefined}
                                removeItem={handleRemoveItem}
                                selected={false}
                                childLabelProp={undefined}
                                translations={{}}
                              />
                              {hasError && <DraggableTagButton.ErrorCaption />}
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
      </VStack>
    </NestedDrawerProvider>
  )
}

export default withJsonFormsArrayLayoutProps(JsonFormsArrayControl)
