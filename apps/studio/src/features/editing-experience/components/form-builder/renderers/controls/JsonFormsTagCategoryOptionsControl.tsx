import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { composePaths, rankWith, schemaMatches, update } from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { get } from "lodash-es"
import { useState } from "react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { AddItemButton } from "../../components/AddItemButton"
import { DeleteConfirmModal } from "../../components/DeleteConfirmModal"
import { DraggableTagButton } from "../../components/DraggableTagButton"
import { EmptyCategory } from "../../components/EmptyCategory"
import { NestedDrawerSwitch } from "../../components/NestedDrawerSwitch"
import { TagRowActionsMenu } from "../../components/TagRowActionsMenu"
import { useBuilderErrors } from "../../ErrorProvider"
import { useArray } from "../../hooks/useArray"
import { useDeleteTarget } from "../../hooks/useDeleteTarget"
import { useLiveLabelIssues } from "../../hooks/useLiveLabelIssues"
import { createDefaultTagOption } from "./constants"

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
  const { core, dispatch } = useJsonForms()
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingDraftLabel, setEditingDraftLabel] = useState("")

  const { blank: blankOptionIndices, duplicate: duplicateOptionIndices } =
    useLiveLabelIssues({ path, editingIndex, editingDraftLabel })

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
  const { isAddItemDisabled, isRemoveItemDisabled, onDragEnd } = arrayResult

  const handleLabelSubmit = (index: number, value: string) => {
    dispatch?.(
      update(
        composePaths(composePaths(path, `${index}`), "label"),
        () => value,
      ),
    )
  }

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
  const { hasErrorAt } = useBuilderErrors()

  return (
    <NestedDrawerSwitch {...props} {...arrayResult}>
      <VStack spacing={0} align="start">
        <VStack align="start" spacing="0.25rem" w="full">
          <HStack w="full" justifyContent="space-between" align="center">
            <Text textStyle="subhead-1" flex={1}>
              {label}
            </Text>
            <AddItemButton
              onClick={addItem(path, createDefaultTagOption())}
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
                    const isBlank = blankOptionIndices.has(index)
                    const hasError =
                      hasErrorAt(childPath) || isDuplicate || isBlank
                    const item = get(core?.data, childPath) as
                      | { label?: string }
                      | undefined

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
                            <DraggableTagButton.Body>
                              <DraggableTagButton.Content
                                gap={
                                  editingIndex === index ? "0.5rem" : undefined
                                }
                              >
                                <DraggableTagButton.EditableLabel
                                  value={item?.label ?? ""}
                                  placeholder={`Item ${index + 1}`}
                                  ariaLabel={`Option ${index + 1} name`}
                                  isInvalid={isDuplicate || isBlank}
                                  isDisabled={!enabled}
                                  isEditing={editingIndex === index}
                                  onSubmit={(value) =>
                                    handleLabelSubmit(index, value)
                                  }
                                  onEditingChange={(isEditing) => {
                                    setEditingIndex(isEditing ? index : null)
                                    setEditingDraftLabel(
                                      isEditing ? (item?.label ?? "") : "",
                                    )
                                  }}
                                  onDraftChange={setEditingDraftLabel}
                                />
                                {hasError && (
                                  <DraggableTagButton.ErrorCaption>
                                    {isDuplicate
                                      ? "An option with this name already exists."
                                      : isBlank
                                        ? "Option name cannot be empty."
                                        : undefined}
                                  </DraggableTagButton.ErrorCaption>
                                )}
                              </DraggableTagButton.Content>
                            </DraggableTagButton.Body>
                            {editingIndex !== index && (
                              <DraggableTagButton.Trailing>
                                <TagRowActionsMenu
                                  noun="option"
                                  index={index}
                                  isDisabled={isRemoveItemDisabled}
                                  onDelete={() => openDeleteModal(index)}
                                />
                              </DraggableTagButton.Trailing>
                            )}
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
          noun="filter option"
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
    </NestedDrawerSwitch>
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
