import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Droppable } from "@hello-pangea/dnd"
import { composePaths, rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { get } from "lodash-es"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { AddItemButton } from "../../components/AddItemButton"
import { DeleteConfirmModal } from "../../components/DeleteConfirmModal"
import { DraggableTagButton } from "../../components/DraggableTagButton"
import { EmptyCategory } from "../../components/EmptyCategory"
import { InlineEditableOptionRow } from "../../components/InlineEditableOptionRow"
import { NestedDrawerSwitch } from "../../components/NestedDrawerSwitch"
import { useBuilderErrors } from "../../ErrorProvider"
import { useArray } from "../../hooks/useArray"
import { useDeleteTarget } from "../../hooks/useDeleteTarget"
import { useInlineEditableOptionRows } from "../../hooks/useInlineEditableOptionRows"
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
  const { core } = useJsonForms()
  const { hasErrorAt } = useBuilderErrors()
  const {
    editingIndex,
    isAnyRowEditing,
    setEditingDraftLabel,
    blankOptionIndices,
    duplicateOptionIndices,
    wrapDragEnd,
    submitLabel,
    createEditingChangeHandler,
  } = useInlineEditableOptionRows(path)

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
  const { isAddItemDisabled, isRemoveItemDisabled } = arrayResult

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
          <DragDropContext onDragEnd={wrapDragEnd(arrayResult.onDragEnd)}>
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
                    const committedLabel = item?.label ?? ""

                    return (
                      <InlineEditableOptionRow
                        key={childPath}
                        draggableId={childPath}
                        index={index}
                        enabled={enabled}
                        label={committedLabel}
                        isAnyRowEditing={isAnyRowEditing}
                        isEditing={editingIndex === index}
                        isAnotherRowEditing={
                          isAnyRowEditing && editingIndex !== index
                        }
                        isDuplicate={isDuplicate}
                        isBlank={isBlank}
                        hasError={hasError}
                        onSubmit={(value) => submitLabel(index, value)}
                        onEditingChange={createEditingChangeHandler(
                          index,
                          committedLabel,
                        )}
                        onDraftChange={setEditingDraftLabel}
                        trailing={
                          <DraggableTagButton.ActionsMenu
                            noun="option"
                            index={index}
                            isDisabled={isRemoveItemDisabled}
                            onDelete={() => openDeleteModal(index)}
                          />
                        }
                      />
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
