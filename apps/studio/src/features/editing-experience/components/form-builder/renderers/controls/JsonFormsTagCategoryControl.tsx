import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import type { CollectionPagePageProps } from "@opengovsg/isomer-components"
import { Text } from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { get } from "lodash-es"
import { useCallback, useMemo, useState } from "react"
import { BiPurchaseTag } from "react-icons/bi"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { DraggableTagButton } from "../../components/DraggableTagButton"
import { DeleteConfirmModal } from "./DeleteConfirmModal"
import { DuplicateLabelError } from "./DuplicateLabelError"
import { JsonFormsArrayControlView } from "./JsonFormsArrayControl"
import { TagRowActionsMenu } from "./TagRowActionsMenu"
import { indicesWithDuplicateLabels } from "./utils/indicesWithDuplicateLabels"

function JsonFormsTagCategoriesArrayLayoutInner(props: ArrayLayoutProps) {
  const { path, removeItems, addItem, data, arraySchema } = props
  const { core } = useJsonForms()
  const page = core?.data as CollectionPagePageProps | undefined

  const items = get(core?.data, path) as { label?: string }[] | undefined
  const duplicateFilterIndices = useMemo(
    () => indicesWithDuplicateLabels(items),
    [items],
  )

  const hasDuplicateFilterNameError = duplicateFilterIndices.size > 0

  const [deleteTarget, setDeleteTarget] = useState<null | {
    index: number
    label: string
  }>(null)

  const isRemoveItemDisabled =
    arraySchema.minItems !== undefined && data <= arraySchema.minItems

  const handleConfirmDelete = () => {
    if (!deleteTarget || !removeItems || isRemoveItemDisabled) return
    removeItems(path, [deleteTarget.index])()
    setDeleteTarget(null)
  }

  // New filters default isRequired to true. Can't set this via JSON Schema default
  // because Studio AJV runs with useDefaults, which would apply it to legacy rows too.
  const addItemWithDefaults = useCallback(
    (itemPath: string, value: unknown) =>
      addItem(itemPath, {
        ...(value as Record<string, unknown>),
        isRequired: true,
      }),
    [addItem],
  )

  return (
    <>
      {hasDuplicateFilterNameError && <DuplicateLabelError noun="filter" />}
      <JsonFormsArrayControlView
        {...props}
        addItem={addItemWithDefaults}
        addItemLabel="Add a filter"
        renderListItem={(rowProps) => {
          const isDuplicate = duplicateFilterIndices.has(rowProps.index)
          const count =
            page?.tagCategories?.[rowProps.index]?.options?.length ?? 0
          const subtitle =
            count === 0
              ? "No option"
              : `${count} ${count > 1 ? "options" : "option"}`
          const isError = rowProps.isError || isDuplicate
          return (
            <DraggableTagButton.Root
              draggableProps={rowProps.draggableProps}
              isError={isError}
              ref={rowProps.ref}
            >
              <DraggableTagButton.Handle
                dragHandleProps={rowProps.dragHandleProps}
              />
              <DraggableTagButton.Body
                onClick={() => rowProps.setSelectedIndex(rowProps.index)}
              >
                <DraggableTagButton.Icon icon={BiPurchaseTag} />
                <DraggableTagButton.Content>
                  <DraggableTagButton.Label
                    index={rowProps.index}
                    path={rowProps.path}
                    schema={rowProps.schema}
                    uischema={rowProps.uischema}
                    enabled={rowProps.enabled}
                    removeItem={rowProps.removeItem}
                  />
                  <DraggableTagButton.Subtitle>
                    {subtitle}
                  </DraggableTagButton.Subtitle>
                  {isError && (
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
                  index={rowProps.index}
                  isDisabled={isRemoveItemDisabled}
                  onDelete={() =>
                    setDeleteTarget({
                      index: rowProps.index,
                      label:
                        page?.tagCategories?.[rowProps.index]?.label?.trim() ??
                        "",
                    })
                  }
                />
              </DraggableTagButton.Trailing>
            </DraggableTagButton.Root>
          )
        }}
      />
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
          onConfirm={handleConfirmDelete}
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
