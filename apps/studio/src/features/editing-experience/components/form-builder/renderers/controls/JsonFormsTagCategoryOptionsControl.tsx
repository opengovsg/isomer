import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import type { CollectionPagePageProps } from "@opengovsg/isomer-components"
import {
  HStack,
  Icon,
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
import { get } from "lodash"
import { useMemo, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import {
  BiDotsHorizontalRounded,
  BiSolidErrorCircle,
  BiTrash,
} from "react-icons/bi"
import { MenuItem } from "~/components/Menu"
import Suspense from "~/components/Suspense"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { pageSchema } from "~/features/editing-experience/schema"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { useBuilderErrors } from "../../ErrorProvider"
import { JsonFormsArrayControlView } from "./JsonFormsArrayControl"
import { hasUniqueItemPropertiesError } from "./utils/hasUniqueItemPropertiesError"
import { indicesWithDuplicateLabels } from "./utils/indicesWithDuplicateLabels"

type CollectionTagOption = NonNullable<
  CollectionPagePageProps["tagCategories"]
>[number]["options"][number]

type CollectionTagOptionId = NonNullable<CollectionTagOption["id"]>

const TagOptionUsageCount = ({
  siteId,
  pageId,
  tagOptionId,
}: {
  siteId: number
  pageId: number
  tagOptionId: CollectionTagOptionId
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
  tagOptionId: CollectionTagOptionId
  label: CollectionTagOption["label"]
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
  const duplicateOptionIndices = useMemo(() => {
    const items = get(core?.data, path) as { label?: string }[] | undefined
    return indicesWithDuplicateLabels(items)
  }, [core?.data, path])

  const hasDuplicateOptionNameError = hasUniqueItemPropertiesError({
    errors,
    jsonFormsPath: path,
  })

  const isRemoveItemDisabled =
    arraySchema.minItems !== undefined && data <= arraySchema.minItems

  const [deleteTarget, setDeleteTarget] = useState<null | {
    index: number
    label: CollectionTagOption["label"]
    tagId: CollectionTagOptionId
  }>(null)

  const { siteId, pageId } = useQueryParse(pageSchema)
  const utils = trpc.useUtils()

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

  const closeDeleteModal = () => {
    void utils.collection.countTagOptionsUsage.invalidate()
    setDeleteTarget(null)
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget || !removeItems || isRemoveItemDisabled) return
    removeItems(path, [deleteTarget.index])()
    closeDeleteModal()
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
            <HStack align="start" gap="0.5rem" mt="0.5rem" w="100%">
              <Icon
                as={BiSolidErrorCircle}
                fontSize="1rem"
                color="utility.feedback.critical"
                mt="0.125rem"
                flexShrink={0}
              />
              <VStack align="start" spacing={0}>
                <Text textStyle="subhead-2" color="utility.feedback.critical">
                  Remove duplicate options before saving.
                </Text>
                <Text textStyle="body-2" color="utility.feedback.critical">
                  Option names are not case-sensitive.
                </Text>
              </VStack>
            </HStack>
          ) : undefined
        }
        getListItemHasError={(index) => duplicateOptionIndices.has(index)}
        renderListItemErrorCaption={(index) =>
          duplicateOptionIndices.has(index)
            ? "An option with this name already exists."
            : undefined
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
          onClose={closeDeleteModal}
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
