import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import type { CollectionPagePageProps } from "@opengovsg/isomer-components"
import {
  MenuButton,
  MenuList,
  Portal,
  Text,
} from "@chakra-ui/react"
import { rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { IconButton, Menu } from "@opengovsg/design-system-react"
import { get } from "lodash-es"
import { useMemo, useState } from "react"
import {
  BiDotsHorizontalRounded,
  BiPurchaseTag,
  BiTrash,
} from "react-icons/bi"
import { MenuItem } from "~/components/Menu"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { useBuilderErrors } from "../../ErrorProvider"
import { DeleteConfirmModal } from "./DeleteConfirmModal"
import DraggableTagButton from "./DraggableTagButton"
import { DuplicateLabelError } from "./DuplicateLabelError"
import { JsonFormsArrayControlView } from "./JsonFormsArrayControl"
import { hasUniqueItemPropertiesError } from "./utils/hasUniqueItemPropertiesError"
import { indicesWithDuplicateLabels } from "./utils/indicesWithDuplicateLabels"

function JsonFormsTagCategoriesArrayLayoutInner(props: ArrayLayoutProps) {
  const { path, removeItems, data, arraySchema } = props
  const { core } = useJsonForms()
  const { errors } = useBuilderErrors()
  const page = core?.data as CollectionPagePageProps | undefined

  const duplicateFilterIndices = useMemo(() => {
    const items = get(core?.data, path) as { label?: string }[] | undefined
    return indicesWithDuplicateLabels(items)
  }, [core?.data, path])

  const hasDuplicateFilterNameError = hasUniqueItemPropertiesError({
    errors,
    jsonFormsPath: path,
  })

  const [deleteTarget, setDeleteTarget] = useState<null | {
    index: number
    label: string
  }>(null)

  const isRemoveItemDisabled =
    arraySchema.minItems !== undefined && data <= arraySchema.minItems

  return (
    <>
      <JsonFormsArrayControlView
        {...props}
        mapNewArrayItem={(item) => ({
          ...(item as Record<string, unknown>),
          // we set this to true by default for new filters
          // we don't set this on JSON Schema because Studio AJV runs with useDefaults, which would apply the
          // same default to legacy rows that omit this key.
          isRequired: true,
        })}
        renderListItem={(rowProps) => {
          const count =
            page?.tagCategories?.[rowProps.index]?.options?.length ?? 0
          const subtitle =
            count === 0
              ? "No option"
              : `${count} ${count > 1 ? "options" : "option"}`
          return (
            <DraggableTagButton
              {...rowProps}
              listItemIcon={BiPurchaseTag}
              listItemContentProps={{ py: "0.5rem" }}
              listItemSubtitle={
                <Text textStyle="caption-2" color="base.content.medium">
                  {subtitle}
                </Text>
              }
              listItemTrailing={
                <Menu isLazy>
                  <MenuButton
                    as={IconButton}
                    colorScheme="neutral"
                    icon={<BiDotsHorizontalRounded fontSize="1.5rem" />}
                    variant="clear"
                    h="2.125rem"
                    w="2.125rem"
                    minH="2.125rem"
                    minW="2.125rem"
                    p="0.25rem"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    isDisabled={isRemoveItemDisabled}
                    aria-label={`Filter ${rowProps.index + 1} actions`}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Portal>
                    <MenuList>
                      <MenuItem
                        colorScheme="critical"
                        icon={<BiTrash fontSize="1rem" />}
                        isDisabled={isRemoveItemDisabled}
                        onClick={(e) => {
                          e.stopPropagation()
                          setDeleteTarget({
                            index: rowProps.index,
                            label:
                              page?.tagCategories?.[
                                rowProps.index
                              ]?.label?.trim() ?? "",
                          })
                        }}
                      >
                        Delete filter
                      </MenuItem>
                    </MenuList>
                  </Portal>
                </Menu>
              }
              listItemErrorCaption={
                duplicateFilterIndices.has(rowProps.index)
                  ? "A filter with this name already exists."
                  : undefined
              }
            />
          )
        }}
        belowDescription={
          hasDuplicateFilterNameError ? (
            <DuplicateLabelError noun="filter" />
          ) : undefined
        }
        getListItemHasError={(index) => duplicateFilterIndices.has(index)}
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
