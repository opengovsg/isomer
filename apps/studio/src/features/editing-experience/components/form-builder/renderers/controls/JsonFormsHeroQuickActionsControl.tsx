import type {
  ArrayLayoutProps,
  OwnPropsOfMasterListItem,
  RankedTester,
  StatePropsOfMasterItem,
} from "@jsonforms/core"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import {
  composePaths,
  createDefaultValue,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import {
  withJsonFormsArrayLayoutProps,
  withJsonFormsMasterListItemProps,
} from "@jsonforms/react"
import { HERO_QUICK_ACTIONS_FORMAT } from "@opengovsg/isomer-components"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { AddItemButton } from "../../components/AddItemButton"
import { DraggableTagButton } from "../../components/DraggableTagButton"
import { EmptyArray } from "../../components/EmptyArray"
import { NestedDrawerSwitch } from "../../components/NestedDrawerSwitch"
import { useBuilderErrors } from "../../ErrorProvider"
import { useArray } from "../../hooks/useArray"

// Copy of JsonFormsArrayControl. The row preview is the item title, not the first field.

const TitleLabelRaw = withJsonFormsMasterListItemProps(
  ({ childLabel, index }: StatePropsOfMasterItem) => (
    <Text textStyle="subhead-2" textAlign="start">
      {childLabel || `Item ${index + 1}`}
    </Text>
  ),
)

type TitleLabelProps = Pick<
  OwnPropsOfMasterListItem,
  "index" | "path" | "schema" | "uischema" | "enabled" | "removeItem"
>

const TitleLabel = (props: TitleLabelProps) => (
  <TitleLabelRaw
    {...props}
    handleSelect={() => () => undefined}
    selected={false}
    childLabelProp="title"
    translations={{}}
  />
)

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
    <NestedDrawerSwitch {...props} {...arrayResult}>
      <VStack spacing={0} align="start">
        <VStack align="start" spacing="0.25rem" w="full">
          <HStack w="full" justifyContent="space-between" align="center">
            <Text textStyle="subhead-1" flex={1}>
              {label}
            </Text>
            <AddItemButton
              onClick={() => {
                addItem(path, createDefaultValue(schema, rootSchema))()
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
                                <TitleLabel
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
