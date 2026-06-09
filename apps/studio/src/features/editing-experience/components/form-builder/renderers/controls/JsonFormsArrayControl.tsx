import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import { Flex, Stack, Text, VStack } from "@chakra-ui/react"
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
import DraggableDrawerButton from "../../components/DraggableDrawerButton"
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
    </NestedDrawerProvider>
  )
}

export default withJsonFormsArrayLayoutProps(JsonFormsArrayControl)
