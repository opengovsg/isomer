import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import type { CollectionPagePageProps } from "@opengovsg/isomer-components"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import {
  composePaths,
  createDefaultValue,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { BiPurchaseTag } from "react-icons/bi"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { AddItemButton } from "../../components/AddItemButton"
import { DeleteConfirmModal } from "../../components/DeleteConfirmModal"
import { DraggableTagButton } from "../../components/DraggableTagButton"
import { DuplicateLabelError } from "../../components/DuplicateLabelError"
import { EmptyArray } from "../../components/EmptyArray"
import { NestedDrawerSwitch } from "../../components/NestedDrawerSwitch"
import { TagRowActionsMenu } from "../../components/TagRowActionsMenu"
import { useBuilderErrors } from "../../ErrorProvider"
import { useArray } from "../../hooks/useArray"
import { useDeleteTarget } from "../../hooks/useDeleteTarget"
import { useDuplicateLabels } from "../../hooks/useDuplicateLabels"

function JsonFormsTagCategoriesArrayLayoutInner(props: ArrayLayoutProps) {
  const {
    data,
    path,
    enabled,
    label,
    addItem,
    removeItems,
    arraySchema,
    schema,
    rootSchema,
    uischemas,
    uischema,
    moveUp,
    moveDown,
    description,
  } = props
  const { hasErrorAt } = useBuilderErrors()
  const { core } = useJsonForms()
  const page = core?.data as CollectionPagePageProps | undefined
  const duplicateFilterIndices = useDuplicateLabels(path)

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
    isRemoveItemDisabled,
    childUiSchema,
    handleRemoveSelectedItem,
    onDragEnd,
  } = arrayResult

  const {
    target: deleteTarget,
    openDeleteModal,
    closeDeleteModal,
    handleConfirmDelete,
  } = useDeleteTarget({
    path,
    removeItems,
    isRemoveItemDisabled,
    resolveTarget: (index) => ({
      label: page?.tagCategories?.[index]?.label?.trim() ?? "",
    }),
  })

  return (
    <NestedDrawerSwitch {...props} {...arrayResult}>
      {duplicateFilterIndices.size > 0 && <DuplicateLabelError noun="filter" />}
      <VStack spacing={0} align="start">
        <VStack align="start" spacing="0.25rem" w="full">
          <HStack w="full" justifyContent="space-between" align="center">
            <Text textStyle="subhead-1" flex={1}>
              {label}
            </Text>
            <AddItemButton
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
              isDisabled={isAddItemDisabled}
            >
              Add a filter
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
                              <DraggableTagButton.Icon icon={BiPurchaseTag} />
                              <DraggableTagButton.Content>
                                <DraggableTagButton.Label
                                  index={index}
                                  path={path}
                                  schema={schema}
                                  uischema={childUiSchema}
                                  enabled={enabled}
                                  removeItem={handleRemoveSelectedItem}
                                />
                                <DraggableTagButton.Subtitle>
                                  {subtitle}
                                </DraggableTagButton.Subtitle>
                                {hasError && (
                                  <DraggableTagButton.ErrorCaption>
                                    {isDuplicate
                                      ? "A filter with this name already exists."
                                      : undefined}
                                  </DraggableTagButton.ErrorCaption>
                                )}
                              </DraggableTagButton.Content>
                            </DraggableTagButton.Body>
                            <DraggableTagButton.Trailing>
                              <TagRowActionsMenu
                                noun="filter"
                                index={index}
                                isDisabled={isRemoveItemDisabled}
                                onDelete={() => openDeleteModal(index)}
                              />
                            </DraggableTagButton.Trailing>
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
          onClose={closeDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </NestedDrawerSwitch>
  )
}

export const jsonFormsTagCategoriesControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TagCategoryControl,
  schemaMatches((schema) => schema.format === "tag-categories"),
)

export default withJsonFormsArrayLayoutProps(
  JsonFormsTagCategoriesArrayLayoutInner,
)
