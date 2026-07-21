import type { DropResult } from "@hello-pangea/dnd"
import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import { Box, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { composePaths, rankWith, schemaMatches, update } from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { get } from "lodash-es"
import { Suspense, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { pageSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"

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

const DELETE_OPTION_UNDO_TEXT =
  "To undo this change, you will need to create and re-assign this option to all items."

function DeleteOptionWarningBody({
  siteId,
  pageId,
  tagId,
}: {
  siteId: number
  pageId: number
  tagId: string
}) {
  const [{ count }] = trpc.collection.countTagOptionsUsage.useSuspenseQuery({
    siteId,
    pageId,
    tagOptionIds: [tagId],
  })

  return (
    <Text textStyle="body-1" color="base.content.strong">
      {count > 0
        ? `This option is being used in ${count === 1 ? "1 item" : `${count} items`}.`
        : ""}
      {DELETE_OPTION_UNDO_TEXT}
    </Text>
  )
}

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
  const { hasErrorAt } = useBuilderErrors()
  const { pageId, siteId } = useQueryParse(pageSchema)
  const items = get(core?.data, path) as
    | { label?: string; id: string }[]
    | undefined
  // Inline label editing is keyed by array index. editingDraftLabel feeds
  // useLiveLabelIssues so duplicate/blank checks reflect unsaved keystrokes.
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [editingDraftLabel, setEditingDraftLabel] = useState("")

  const isAnyRowEditing = editingIndex !== null

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

  const clearEditing = () => {
    setEditingIndex(null)
    setEditingDraftLabel("")
  }

  // editingIndex is a row position, not item identity — clear before reorder so
  // a pending label submit cannot write to whichever item ends up at that index.
  const handleDragEnd = (result: DropResult) => {
    clearEditing()
    onDragEnd(result)
  }

  const submitLabel = (childPath: string, value: string) => {
    dispatch?.(update(composePaths(childPath, "label"), () => value))
  }

  const handleEditingChange = (
    index: number,
    committedLabel: string,
    isEditing: boolean,
  ) => {
    if (isEditing && editingIndex !== null && editingIndex !== index) return
    setEditingIndex(isEditing ? index : null)
    setEditingDraftLabel(isEditing ? committedLabel : "")
  }

  const {
    target: deleteTarget,
    openDeleteModal,
    closeDeleteModal,
    handleConfirmDelete,
  } = useDeleteTarget<{ label: string; tagId: string }>({
    path,
    removeItems,
    isRemoveItemDisabled,
    resolveTarget: (index) => ({
      label: items?.[index]?.label?.trim() ?? "",
      tagId: items?.[index]?.id ?? "", // always set by createDefaultTagOption()
    }),
  })

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
              isDisabled={isAddItemDisabled || isAnyRowEditing}
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
          <DragDropContext onDragEnd={handleDragEnd}>
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
                    const committedLabel = items?.[index]?.label ?? ""
                    const isEditing = editingIndex === index
                    const optionName = `Option ${index + 1}`
                    const errorMessage = isDuplicate
                      ? "An option with this name already exists."
                      : isBlank
                        ? "Option name cannot be empty."
                        : undefined

                    return (
                      <Draggable
                        key={childPath}
                        draggableId={childPath}
                        disableInteractiveElementBlocking
                        isDragDisabled={isAnyRowEditing}
                        index={index}
                      >
                        {({ draggableProps, dragHandleProps, innerRef }) => (
                          <DraggableTagButton.Root
                            draggableProps={draggableProps}
                            isError={hasError}
                            isDragDisabled={isAnyRowEditing}
                            ref={innerRef}
                          >
                            <DraggableTagButton.Handle
                              dragHandleProps={dragHandleProps}
                            />
                            <DraggableTagButton.Body>
                              <DraggableTagButton.Content
                                gap={isEditing ? "0.5rem" : undefined}
                              >
                                <DraggableTagButton.EditableLabel
                                  value={committedLabel}
                                  placeholder={optionName}
                                  ariaLabel={`${optionName} name`}
                                  isInvalid={isDuplicate || isBlank}
                                  isDisabled={
                                    !enabled || (isAnyRowEditing && !isEditing)
                                  }
                                  isEditing={isEditing}
                                  onSubmit={(value) =>
                                    submitLabel(childPath, value)
                                  }
                                  onEditingChange={(nextIsEditing) =>
                                    handleEditingChange(
                                      index,
                                      committedLabel,
                                      nextIsEditing,
                                    )
                                  }
                                  onDraftChange={setEditingDraftLabel}
                                />
                                {hasError ? (
                                  <DraggableTagButton.ErrorCaption>
                                    {errorMessage}
                                  </DraggableTagButton.ErrorCaption>
                                ) : (
                                  isEditing && (
                                    <DraggableTagButton.InfoCaption>
                                      This will update across all items that use
                                      this option.
                                    </DraggableTagButton.InfoCaption>
                                  )
                                )}
                              </DraggableTagButton.Content>
                            </DraggableTagButton.Body>
                            {!isEditing && (
                              <DraggableTagButton.Trailing>
                                <TagRowActionsMenu
                                  noun="option"
                                  index={index}
                                  isDisabled={isRemoveItemDisabled}
                                  isDragDisabled={isAnyRowEditing}
                                  onDelete={() => {
                                    clearEditing()
                                    openDeleteModal(index)
                                  }}
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
            <ErrorBoundary
              fallbackRender={() => (
                <Text textStyle="body-1" color="base.content.strong">
                  {DELETE_OPTION_UNDO_TEXT}
                </Text>
              )}
            >
              <Suspense fallback={<Skeleton height="2.5em" width="100%" />}>
                <DeleteOptionWarningBody
                  siteId={siteId}
                  pageId={pageId}
                  tagId={deleteTarget.tagId}
                />
              </Suspense>
            </ErrorBoundary>
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

export default JsonFormsTagCategoryOptionsArrayLayout
