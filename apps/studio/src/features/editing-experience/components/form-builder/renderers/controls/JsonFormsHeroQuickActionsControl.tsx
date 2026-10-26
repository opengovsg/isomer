import type {
  ArrayLayoutProps,
  RankedTester,
  UISchemaElement,
} from "@jsonforms/core"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { composePaths, rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { HERO_QUICK_ACTIONS_FORMAT } from "@opengovsg/isomer-components"
import { get } from "lodash-es"
import { useCallback } from "react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { AddItemButton } from "../../components/AddItemButton"
import { DraggableTagButton } from "../../components/DraggableTagButton"
import { EmptyArray } from "../../components/EmptyArray"
import { NestedDrawerSwitch } from "../../components/NestedDrawerSwitch"
import { useBuilderErrors } from "../../ErrorProvider"
import { useArray } from "../../hooks/useArray"
import { createDefaultHeroActionLayoutQuickActionItem } from "./JsonFormsHeroActionLayoutControl/constants"

// Copy of JsonFormsArrayControl: rows show the item title, new items get quick action
// defaults, and the item icon field follows the parent showIcon flag.

const omitUiSchemaFields = (
  uischema: UISchemaElement,
  hiddenFields: string[],
): UISchemaElement => {
  if (!("elements" in uischema) || !Array.isArray(uischema.elements)) {
    return uischema
  }

  const hidden = new Set(hiddenFields)

  return {
    ...uischema,
    elements: uischema.elements.filter((element) => {
      const scope = (element as { scope?: string }).scope
      const field = scope?.split("/").pop()

      return !field || !hidden.has(field)
    }),
  }
}

export const jsonFormsHeroQuickActionsControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.HeroQuickActionsControl,
  schemaMatches((schema) => schema.format === HERO_QUICK_ACTIONS_FORMAT),
)

function JsonFormsHeroQuickActionsControl(props: ArrayLayoutProps) {
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
  const ctx = useJsonForms()
  const showIcon = get(
    ctx.core?.data as Record<string, unknown>,
    "showIcon",
    true,
  )
  const mapChildUiSchema = useCallback(
    (uischema: UISchemaElement) =>
      showIcon ? uischema : omitUiSchemaFields(uischema, ["icon"]),
    [showIcon],
  )
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
    handleRemoveSelectedItem,
    onDragEnd,
  } = arrayResult

  return (
    <NestedDrawerSwitch
      {...props}
      {...arrayResult}
      // Item icon follows the parent showIcon flag.
      childUiSchema={mapChildUiSchema(childUiSchema)}
    >
      <VStack spacing={0} align="start">
        <VStack align="start" spacing="0.25rem" w="full">
          <HStack w="full" justifyContent="space-between" align="center">
            <Text textStyle="subhead-1" flex={1}>
              {label}
            </Text>
            <AddItemButton
              onClick={() => {
                addItem(path, createDefaultHeroActionLayoutQuickActionItem())()
                setSelectedIndex(data)
              }}
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
                              py={hasError ? "0.75rem" : "1.25rem"}
                            />
                            <DraggableTagButton.Body
                              onClick={() => setSelectedIndex(index)}
                              py={hasError ? "0.75rem" : "1rem"}
                            >
                              <DraggableTagButton.Content>
                                <DraggableTagButton.Label
                                  childLabelProp="title"
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

export default withJsonFormsArrayLayoutProps(JsonFormsHeroQuickActionsControl)
