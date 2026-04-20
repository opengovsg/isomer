import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import {
  HStack,
  MenuButton,
  MenuList,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Portal,
  Skeleton,
  Text,
  VStack,
} from "@chakra-ui/react"
import { composePaths, rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import {
  Button,
  Checkbox,
  IconButton,
  Infobox,
  Menu,
  ModalCloseButton,
} from "@opengovsg/design-system-react"
import get from "lodash/get"
import { useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { BiDotsHorizontalRounded, BiTrash } from "react-icons/bi"
import { MenuItem } from "~/components/Menu"
import Suspense from "~/components/Suspense"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { pageSchema } from "~/features/editing-experience/schema"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { CollectionPagePageProps } from "../../../../../../../../../packages/components/dist/esm/types/page"
import { useBuilderErrors } from "../../ErrorProvider"
import { JsonFormsArrayControlView } from "./JsonFormsArrayControl"
import { hasUniqueItemPropertiesError } from "./utils/hasUniqueItemPropertiesError"

type CollectionTagOption = NonNullable<
  CollectionPagePageProps["tagCategories"]
>[number]["options"][number]

const TagOptionUsageCount = ({
  siteId,
  pageId,
  tagOptionId,
}: {
  siteId: number
  pageId: number
  tagOptionId: string
}) => {
  const [{ count }] = trpc.collection.countTagOptionsUsage.useSuspenseQuery({
    siteId,
    pageId,
    tagOptionIds: [tagOptionId],
  })

  return <>{count ?? "—"}</>
}

const DeleteOptionModal = ({
  isOpen,
  siteId,
  pageId,
  tagOptionId,
  label,
  onClose,
  onConfirm,
}: {
  isOpen: boolean
  siteId: number
  pageId: number
  tagOptionId: string
  label: string
  onClose: () => void
  onConfirm: () => void
}) => {
  const [isChecked, setIsChecked] = useState(false)

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">
          {label.length > 0 ? `Delete option "${label}"?` : "Delete option?"}
        </ModalHeader>
        <ModalCloseButton size="lg" />

        <ModalBody>
          <VStack align="stretch" spacing="1.5rem">
            <Infobox width="100%" size="md" variant="warning">
              <Text textStyle="body-2">
                This option is being used in{" "}
                <ErrorBoundary fallbackRender={() => <>—</>}>
                  <Suspense
                    fallback={
                      <Skeleton
                        as="span"
                        display="inline-block"
                        verticalAlign="middle"
                        height="1em"
                        width="2ch"
                      />
                    }
                  >
                    <TagOptionUsageCount
                      siteId={siteId}
                      pageId={pageId}
                      tagOptionId={tagOptionId}
                    />
                  </Suspense>
                </ErrorBoundary>{" "}
                items. To undo this change, you will need to create and
                re-assign this option to all items.
              </Text>
            </Infobox>
            <HStack align="start">
              <Checkbox
                isChecked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
              >
                <Text textStyle="body-2">
                  Yes, delete this option permanently
                </Text>
              </Checkbox>
            </HStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing="1rem">
            <Button variant="clear" colorScheme="neutral" onClick={onClose}>
              No, keep option
            </Button>
            <Button
              isDisabled={!isChecked}
              variant="solid"
              colorScheme="critical"
              onClick={onConfirm}
            >
              Delete option
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

const JsonFormsTagCategoryOptionsArrayLayoutInner = (
  props: ArrayLayoutProps,
) => {
  const { path, removeItems, data, arraySchema } = props
  const { core } = useJsonForms()
  const { errors } = useBuilderErrors()
  const hasDuplicateOptionNameError = hasUniqueItemPropertiesError({
    errors,
    jsonFormsPath: path,
  })

  const isRemoveItemDisabled =
    arraySchema.minItems !== undefined && data <= arraySchema.minItems

  const [deleteTarget, setDeleteTarget] = useState<null | {
    index: number
    label: string
    tagId: string
  }>(null)

  const { siteId, pageId } = useQueryParse(pageSchema)

  const handleDeleteOptionMenuItemClick = (index: number) => {
    const item = get(core?.data, composePaths(path, `${index}`)) as
      | Partial<CollectionTagOption>
      | undefined

    const tagId = item?.id?.trim()

    // No id means the option is new and never saved — nothing references it in the DB,
    // so we remove the row immediately instead of opening the usage warning modal.
    if (!tagId) {
      if (!removeItems || isRemoveItemDisabled) return
      removeItems(path, [index])()
      return
    }

    // Persisted option: show the modal so we can warn about existing item usage before delete.
    setDeleteTarget({
      index,
      label: item?.label?.trim() ?? "",
      tagId,
    })
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget || !removeItems || isRemoveItemDisabled) return
    removeItems(path, [deleteTarget.index])()
    setDeleteTarget(null)
  }

  return (
    <>
      <JsonFormsArrayControlView
        {...props}
        listItemContentProps={{ py: "0.5rem" }}
        renderListItemTrailing={(index) => (
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
              aria-label={`Option ${index + 1} actions`}
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
                    handleDeleteOptionMenuItemClick(index)
                  }}
                >
                  Delete option
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        )}
        belowDescription={
          hasDuplicateOptionNameError ? (
            <Infobox width="100%" size="sm" variant="error" mt="0.5rem">
              <Text textStyle="body-2">
                Each option must have a unique name. Names are not
                case-sensitive, so rename the duplicate before saving changes.
              </Text>
            </Infobox>
          ) : undefined
        }
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
        <DeleteOptionModal
          isOpen
          siteId={siteId}
          pageId={pageId}
          tagOptionId={deleteTarget.tagId}
          label={deleteTarget.label}
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
