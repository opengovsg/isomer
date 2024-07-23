import type { DropResult } from "@hello-pangea/dnd"
import type {
  ArrayLayoutProps,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  RankedTester,
  UISchemaElement,
} from "@jsonforms/core"
import { useCallback, useMemo, useState } from "react"
import {
  Box,
  Flex,
  Heading,
  HStack,
  Icon,
  Text,
  VStack,
} from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import {
  composePaths,
  createDefaultValue,
  findUISchema,
  isObjectArrayControl,
  rankWith,
  Resolve,
} from "@jsonforms/core"
import {
  JsonFormsDispatch,
  withJsonFormsArrayLayoutProps,
} from "@jsonforms/react"
import { Button, IconButton } from "@opengovsg/design-system-react"
import { BiX } from "react-icons/bi"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import DraggableDrawerButton from "./DraggableDrawerButton"

export const jsonFormsArrayControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.ArrayControl,
  isObjectArrayControl,
)

interface ComplexEditorNestedDrawerProps {
  renderers?: JsonFormsRendererRegistryEntry[]
  cells?: JsonFormsCellRendererRegistryEntry[]
  visible: boolean
  schema: JsonSchema
  uischema: UISchemaElement
  path: string
  label: string
  setSelectedIndex: (selectedIndex?: number) => void
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
}: ComplexEditorNestedDrawerProps) {
  return (
    <VStack
      spacing={5}
      position="absolute"
      top={0}
      left={0}
      px="2rem"
      py="1.5rem"
      bgColor="grey.50"
      w="100%"
      h="100%"
    >
      <HStack justifyContent="space-between" w="100%">
        <Heading as="h3" size="sm" variant="subhead-1" fontWeight="medium">
          Edit {label}
        </Heading>
        <IconButton
          icon={<Icon as={BiX} />}
          variant="clear"
          colorScheme="sub"
          size="sm"
          p="0.625rem"
          onClick={() => setSelectedIndex()}
          aria-label="Close drawer"
        />
      </HStack>

      <Box w="100%" h="100%">
        <JsonFormsDispatch
          renderers={renderers}
          cells={cells}
          visible={visible}
          schema={schema}
          uischema={uischema}
          path={path}
        />
      </Box>
    </VStack>
  )
}

export function JsonFormsArrayControl({
  data,
  path,
  visible,
  enabled,
  label,
  addItem,
  removeItems,
  moveUp,
  moveDown,
  minItems,
  schema,
  rootSchema,
  renderers,
  cells,
  uischemas,
  uischema,
  translations,
}: ArrayLayoutProps) {
  const [selectedIndex, setSelectedIndex] = useState<number>()
  const resolvedSchema = Resolve.schema(rootSchema, uischema.scope, rootSchema)
  const maxItems =
    // NOTE: resolvedSchema can potentially be undefined
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    resolvedSchema !== undefined ? resolvedSchema.maxItems : undefined
  const handleRemoveItem = useCallback(
    (path: string, index: number) => () => {
      if (selectedIndex === undefined || !removeItems) {
        return
      }

      removeItems(path, [index])()

      if (selectedIndex === index) {
        setSelectedIndex(undefined)
      } else if (selectedIndex > index) {
        setSelectedIndex(selectedIndex - 1)
      }
    },
    [removeItems, selectedIndex],
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

  return (
    <VStack py={2} spacing="0.375rem">
      <Heading
        as="h3"
        size="sm"
        variant="subhead-1"
        fontWeight="medium"
        w="100%"
      >
        {label}
      </Heading>

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
                  p="3.75rem"
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

                return (
                  <Draggable
                    key={childPath}
                    draggableId={childPath}
                    index={index}
                  >
                    {({ draggableProps, dragHandleProps, innerRef }) => (
                      <DraggableDrawerButton
                        draggableProps={draggableProps}
                        dragHandleProps={dragHandleProps}
                        ref={innerRef}
                        index={index}
                        path={path}
                        schema={schema}
                        enabled={enabled}
                        handleSelect={() => () => undefined}
                        removeItem={handleRemoveItem}
                        selected={selectedIndex === index}
                        key={index}
                        uischema={childUiSchema}
                        childLabelProp={undefined}
                        translations={translations}
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

      {selectedIndex !== undefined && (
        <ComplexEditorNestedDrawer
          renderers={renderers}
          cells={cells}
          visible={visible}
          schema={schema}
          uischema={childUiSchema}
          path={composePaths(path, `${selectedIndex}`)}
          label={label}
          setSelectedIndex={setSelectedIndex}
        />
      )}

      {selectedIndex === undefined ? (
        <Button
          onClick={addItem(path, createDefaultValue(schema, rootSchema))}
          w="100%"
          variant="outline"
          isDisabled={maxItems !== undefined && data >= maxItems}
        >
          Add item
        </Button>
      ) : (
        <Button
          onClick={handleRemoveItem(path, selectedIndex)}
          variant="clear"
          colorScheme="critical"
          isDisabled={minItems !== undefined && data <= minItems}
        >
          Remove item
        </Button>
      )}
    </VStack>
  )
}

export default withJsonFormsArrayLayoutProps(JsonFormsArrayControl)
