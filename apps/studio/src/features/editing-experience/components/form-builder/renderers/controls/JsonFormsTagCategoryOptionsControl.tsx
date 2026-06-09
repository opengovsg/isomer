import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import { Text, VStack } from "@chakra-ui/react"
import { composePaths, rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { get } from "lodash-es"
import { useMemo, useState } from "react"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { DeleteConfirmModal } from "../../components/DeleteConfirmModal"
import { TagDraggableButton } from "../../components/DraggableTagButton"
import { DuplicateLabelError } from "../../components/DuplicateLabelError"
import { JsonFormsArrayControlView } from "./JsonFormsArrayControl"
import { indicesWithDuplicateLabels } from "./utils/indicesWithDuplicateLabels"
import { TagRowActionsMenu } from "./TagRowActionsMenu";

const JsonFormsTagCategoryOptionsArrayLayoutInner = (
  props: ArrayLayoutProps,
) => {
  const { path, removeItems, data, arraySchema } = props
  const { core } = useJsonForms()
  const items = get(core?.data, path) as { label?: string }[] | undefined
  const duplicateOptionIndices = useMemo(
    () => indicesWithDuplicateLabels(items),
    [items],
  )

  const isRemoveItemDisabled =
    arraySchema.minItems !== undefined && data <= arraySchema.minItems

  const [deleteTarget, setDeleteTarget] = useState<null | {
    index: number
    label: string
    tagId?: string
  }>(null)

  const openDeleteModal = (index: number) => {
    const item = get(core?.data, composePaths(path, `${index}`)) as
      | { label?: string; id?: string }
      | undefined
    setDeleteTarget({
      index,
      label: item?.label?.trim() ?? "",
      tagId: item?.id,
    })
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget || !removeItems || isRemoveItemDisabled) return
    removeItems(path, [deleteTarget.index])()
    setDeleteTarget(null)
  }

  return (
    <>
      {duplicateOptionIndices.size > 0 && <DuplicateLabelError noun="option" />}
      <JsonFormsArrayControlView
        {...props}
        addItemLabel="Add option"
        renderListItem={(rowProps) => {
          const isDuplicate = duplicateOptionIndices.has(rowProps.index)
          return (
            <TagDraggableButton
              {...rowProps}
              isError={rowProps.isError || isDuplicate}
              listItemContentProps={{ py: "0.5rem" }}
              listItemTrailing={
                <TagRowActionsMenu
                  noun="option"
                  index={rowProps.index}
                  isDisabled={isRemoveItemDisabled}
                  onDelete={() => openDeleteModal(rowProps.index)}
                />
              }
              listItemErrorCaption={
                isDuplicate
                  ? "An option with this name already exists."
                  : undefined
              }
            />
          )
        }}
        emptyState={
          <VStack spacing="0.25rem" align="center">
            <Text
              textStyle="subhead-2"
              textColor="base.content.default"
              textAlign="center"
            >
              Add an option to save this filter
            </Text>
            <Text
              textStyle="caption-2"
              textColor="base.content.default"
              textAlign="center"
            >
              Users will choose from this list when creating new items.
            </Text>
          </VStack>
        }
      />
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
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
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
