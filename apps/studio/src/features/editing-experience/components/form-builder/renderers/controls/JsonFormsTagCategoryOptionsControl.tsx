import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import { MenuButton, MenuList, Portal, Text, VStack } from "@chakra-ui/react"
import { composePaths, rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { IconButton, Menu } from "@opengovsg/design-system-react"
import { get } from "lodash-es"
import { useMemo, useState } from "react"
import { BiDotsHorizontalRounded, BiTrash } from "react-icons/bi"
import { MenuItem } from "~/components/Menu"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { ROW_ACTIONS_MENU_BUTTON_PROPS } from "./constants"
import { DeleteConfirmModal } from "./DeleteConfirmModal"
import DraggableTagButton from "./DraggableTagButton"
import { DuplicateLabelError } from "./DuplicateLabelError"
import { JsonFormsArrayControlView } from "./JsonFormsArrayControl"
import { indicesWithDuplicateLabels } from "./utils/indicesWithDuplicateLabels"

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

  const hasDuplicateOptionNameError = duplicateOptionIndices.size > 0

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
      {hasDuplicateOptionNameError && <DuplicateLabelError noun="option" />}
      <JsonFormsArrayControlView
        {...props}
        addItemLabel="Add option"
        renderListItem={(rowProps) => {
          const isDuplicate = duplicateOptionIndices.has(rowProps.index)
          return (
            <DraggableTagButton
              {...rowProps}
              isError={rowProps.isError || isDuplicate}
              listItemContentProps={{ py: "0.5rem" }}
              listItemTrailing={
                <Menu isLazy>
                  <MenuButton
                    as={IconButton}
                    icon={<BiDotsHorizontalRounded fontSize="1.5rem" />}
                    {...ROW_ACTIONS_MENU_BUTTON_PROPS}
                    isDisabled={isRemoveItemDisabled}
                    aria-label={`Option ${rowProps.index + 1} actions`}
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
                          openDeleteModal(rowProps.index)
                        }}
                      >
                        Delete option
                      </MenuItem>
                    </MenuList>
                  </Portal>
                </Menu>
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
