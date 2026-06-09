import type { DropResult } from "@hello-pangea/dnd"
import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import type { CollectionPagePageProps } from "@opengovsg/isomer-components"
import { Box, Flex, HStack, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import {
  composePaths,
  createDefaultValue,
  findUISchema,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { Button } from "@opengovsg/design-system-react"
import { get } from "lodash-es"
import { useCallback, useMemo, useState } from "react"
import { BiPlusCircle, BiPurchaseTag } from "react-icons/bi"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { ComplexEditorNestedDrawer } from "../../components/ComplexEditorNestedDrawer"
import { DeleteConfirmModal } from "../../components/DeleteConfirmModal"
import DraggableTagButton from "../../components/DraggableTagButton"
import { DuplicateLabelError } from "../../components/DuplicateLabelError"
import { useBuilderErrors } from "../../ErrorProvider"
import { TagRowActionsMenu } from "./TagRowActionsMenu"
import { indicesWithDuplicateLabels } from "./utils/indicesWithDuplicateLabels"

function JsonFormsTagCategoriesArrayLayoutInner(props: ArrayLayoutProps) {
  const {
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
  } = props
  const { hasErrorAt } = useBuilderErrors()
  const { core } = useJsonForms()
  const page = core?.data as CollectionPagePageProps | undefined
  const items = get(core?.data, path) as { label?: string }[] | undefined
  const duplicateFilterIndices = useMemo(
    () => indicesWithDuplicateLabels(items),
    [items],
  )

  const [deleteTarget, setDeleteTarget] = useState<null | {
    index: number
    label: string
  }>(null)
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
  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) {
        return
      }
      handleMoveItem(path, result.source.index, result.destination.index)
    },
    [path, handleMoveItem],
  )

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
    <>
      {duplicateFilterIndices.size > 0 && <DuplicateLabelError noun="filter" />}
      <VStack spacing={0} align="start">
        <VStack align="start" spacing="0.25rem" w="full">
          <HStack w="full" justifyContent="space-between" align="center">
            <Text textStyle="subhead-1" flex={1}>
              {label}
            </Text>
            <Button
              onClick={addItem(path, {
                ...(createDefaultValue(schema, rootSchema) as Record<
                  string,
                  unknown
                >),
                // Set on new filters but not in JSON Schema: Studio AJV runs with
                // useDefaults, which would also apply the default to legacy rows
                // that omit this key.
                isRequired: true,
              })}
              variant="clear"
              size="xs"
              leftIcon={<BiPlusCircle fontSize="1.25rem" />}
              isDisabled={
                arraySchema.maxItems !== undefined &&
                data >= arraySchema.maxItems
              }
              flexShrink={0}
            >
              Add a filter
            </Button>
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
                    const isDuplicate = duplicateFilterIndices.has(index)
                    const hasError = hasErrorAt(childPath) || isDuplicate
                    const count =
                      page?.tagCategories?.[index]?.options?.length ?? 0
                    const subtitle =
                      count === 0
                        ? "No option"
                        : `${count} ${count > 1 ? "options" : "option"}`

                    return (
                      <Draggable
                        key={childPath}
                        draggableId={childPath}
                        disableInteractiveElementBlocking
                        index={index}
                      >
                        {({ draggableProps, dragHandleProps, innerRef }) => (
                          <DraggableTagButton
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
                            uischema={childUiSchema}
                            childLabelProp={undefined}
                            translations={{}}
                            setSelectedIndex={setSelectedIndex}
                            listItemIcon={BiPurchaseTag}
                            listItemSubtitle={
                              <Text
                                textStyle="caption-2"
                                color="base.content.medium"
                              >
                                {subtitle}
                              </Text>
                            }
                            listItemTrailing={
                              <TagRowActionsMenu
                                noun="filter"
                                index={index}
                                isDisabled={isRemoveItemDisabled}
                                onDelete={() =>
                                  setDeleteTarget({
                                    index,
                                    label:
                                      page?.tagCategories?.[
                                        index
                                      ]?.label?.trim() ?? "",
                                  })
                                }
                              />
                            }
                            listItemErrorCaption={
                              isDuplicate
                                ? "A filter with this name already exists."
                                : undefined
                            }
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
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen
          label={deleteTarget.label}
          noun="filter"
          warningBody={
            <Text textStyle="body-1" color="base.content.strong">
              This removes the filter and its options from the collection.
              Collection items that use these options may need to be updated
              manually.
            </Text>
          }
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => {
            if (!deleteTarget || !removeItems || isRemoveItemDisabled) return
            removeItems(path, [deleteTarget.index])()
            setDeleteTarget(null)
          }}
        />
      )}
    </>
  )
}

export const jsonFormsTagCategoriesControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TagCategoryControl,
  schemaMatches((schema) => schema.format === "tag-categories"),
)

export default withJsonFormsArrayLayoutProps(
  JsonFormsTagCategoriesArrayLayoutInner,
)
