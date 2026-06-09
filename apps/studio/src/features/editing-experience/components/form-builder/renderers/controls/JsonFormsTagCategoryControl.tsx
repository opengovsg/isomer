import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core";
import type { CollectionPagePageProps } from "@opengovsg/isomer-components";
import { Text } from "@chakra-ui/react";
import { rankWith, schemaMatches } from "@jsonforms/core";
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react";
import { get } from "lodash-es";
import { useMemo, useState } from "react";
import { BiPurchaseTag } from "react-icons/bi";
import { JSON_FORMS_RANKING } from "~/constants/formBuilder";

import { DeleteConfirmModal } from "../../components/DeleteConfirmModal";
import { TagDraggableButton } from "../../components/DraggableTagButton";
import { DuplicateLabelError } from "../../components/DuplicateLabelError";
import { JsonFormsArrayControlView } from "./JsonFormsArrayControl";
import { indicesWithDuplicateLabels } from "./utils/indicesWithDuplicateLabels";
import { TagRowActionsMenu } from "./TagRowActionsMenu";

function JsonFormsTagCategoriesArrayLayoutInner(props: ArrayLayoutProps) {
  const { path, removeItems, data, arraySchema } = props
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

  const isRemoveItemDisabled =
    arraySchema.minItems !== undefined && data <= arraySchema.minItems

  return (
    <>
      {duplicateFilterIndices.size > 0 && <DuplicateLabelError noun="filter" />}
      <JsonFormsArrayControlView
        {...props}
        addItemLabel="Add a filter"
        mapNewArrayItem={(item) => ({
          ...(item as Record<string, unknown>),
          // we set this to true by default for new filters
          // we don't set this on JSON Schema because Studio AJV runs with useDefaults, which would apply the
          // same default to legacy rows that omit this key.
          isRequired: true,
        })}
        renderListItem={(rowProps) => {
          const isDuplicate = duplicateFilterIndices.has(rowProps.index)
          const count =
            page?.tagCategories?.[rowProps.index]?.options?.length ?? 0
          const subtitle =
            count === 0
              ? "No option"
              : `${count} ${count > 1 ? "options" : "option"}`
          return (
            <TagDraggableButton
              {...rowProps}
              isError={rowProps.isError || isDuplicate}
              listItemIcon={BiPurchaseTag}
              listItemContentProps={{ py: "0.5rem" }}
              listItemSubtitle={
                <Text textStyle="caption-2" color="base.content.medium">
                  {subtitle}
                </Text>
              }
              listItemTrailing={<TagRowActionsMenu
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
              />}
              listItemErrorCaption={
                isDuplicate
                  ? "A filter with this name already exists."
                  : undefined
              }
            />
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
