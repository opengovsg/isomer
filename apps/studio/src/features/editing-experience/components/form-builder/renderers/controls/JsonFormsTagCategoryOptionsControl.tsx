import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import {
  composePaths,
  createDefaultValue,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { get } from "lodash-es"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { AddItemButton } from "../../components/AddItemButton"
import { DeleteConfirmModal } from "../../components/DeleteConfirmModal"
import { DraggableTagButton } from "../../components/DraggableTagButton"
import { DuplicateLabelError } from "../../components/DuplicateLabelError"
import { EmptyCategory } from "../../components/EmptyCategory"
import { NestedDrawerProvider } from "../../components/NestedDrawerProvider"
import { useBuilderErrors } from "../../ErrorProvider"
import { useArray } from "../../hooks/useArray"
import { useDeleteTarget } from "../../hooks/useDeleteTarget"
import { useDuplicateLabels } from "../../hooks/useDuplicateLabels"
import { TagRowActionsMenu } from "./TagRowActionsMenu"

const JsonFormsTagCategoryOptionsArrayLayoutInner = (
  props: ArrayLayoutProps,
) => {
  const {
    data,
    path,
    enabled,
    label,
    addItem,
    removeItems,
    moveUp,
    moveDown,
    arraySchema,
    schema,
    rootSchema,
    uischemas,
    uischema,
    description,
  } = props
  const { hasErrorAt } = useBuilderErrors()
  const { core } = useJsonForms()
  const duplicateOptionIndices = useDuplicateLabels(path)

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
    handleRemoveItem,
    onDragEnd,
  } = arrayResult

  const {
    target: deleteTarget,
    openDeleteModal,
    closeDeleteModal,
    handleConfirmDelete,
  } = useDeleteTarget<{ label: string; tagId?: string }>({
    path,
    removeItems,
    isRemoveItemDisabled,
    resolveTarget: (index) => {
      const item = get(core?.data, composePaths(path, `${index}`)) as
        | { label?: string; id?: string }
        | undefined
      return {
        label: item?.label?.trim() ?? "",
        tagId: item?.id,
      }
    },
  })

  return (
    <NestedDrawerProvider {...props} {...arrayResult}>
      {duplicateOptionIndices.size > 0 && <DuplicateLabelError noun="option" />}
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
              Add option
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
                  {data === 0 && (
                    <EmptyCategory title="Add an option to save this filter" />
                  )}

                  {[...Array(data).keys()].map((index) => {
                    const childPath = composePaths(path, `${index}`)
                    const isDuplicate = duplicateOptionIndices.has(index)
                    const hasError = hasErrorAt(childPath) || isDuplicate

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
                                  removeItem={handleRemoveItem}
                                />
                                {hasError && (
                                  <DraggableTagButton.ErrorCaption>
                                    {isDuplicate
                                      ? "An option with this name already exists."
                                      : undefined}
                                  </DraggableTagButton.ErrorCaption>
                                )}
                              </DraggableTagButton.Content>
                            </DraggableTagButton.Body>
                            <DraggableTagButton.Trailing>
                              <TagRowActionsMenu
                                noun="option"
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
          noun="option"
          warningBody={
            <Text textStyle="body-2">
              {/* TODO: replace XX with usage count from backend */}
              This option is being used in XX items. To undo this change, you
              will need to create and re-assign this option to all items.
            </Text>
          }
          onClose={closeDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </NestedDrawerProvider>
  )
}

const JsonFormsTagCategoryOptionsArrayLayout = withJsonFormsArrayLayoutProps(
  JsonFormsTagCategoryOptionsArrayLayoutInner,
)

export const jsonFormsTagCategoryOptionsControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TagCategoryOptionsControl,
  schemaMatches((schema) => schema.format === "tag-category-options"),
)

const JsonFormsTagCategoryOptionsControl = (props: ArrayLayoutProps) => {
  const { isAdmin: isUserIsomerAdmin } = useIsUserIsomerAdmin({
    roles: [IsomerAdminRole.Core, IsomerAdminRole.Migrator],
  })

  if (!isUserIsomerAdmin) {
    return null
  }

  return <JsonFormsTagCategoryOptionsArrayLayout {...props} />
}

export default JsonFormsTagCategoryOptionsControl
