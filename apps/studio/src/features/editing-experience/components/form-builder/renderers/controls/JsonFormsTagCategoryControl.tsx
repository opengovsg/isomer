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
import { compact, map, get } from "lodash-es"
import { useMemo, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import {
  BiDotsHorizontalRounded,
  BiPurchaseTag,
  BiSolidErrorCircle,
  BiTrash,
} from "react-icons/bi"
import { MenuItem } from "~/components/Menu"
import Suspense from "~/components/Suspense"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { pageSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"

import { useBuilderErrors } from "../../ErrorProvider"
import { JsonFormsArrayControlView } from "./JsonFormsArrayControl"
import { hasUniqueItemPropertiesError } from "./utils/hasUniqueItemPropertiesError"
import { indicesWithDuplicateLabels } from "./utils/indicesWithDuplicateLabels"

type CollectionTagCategory = NonNullable<
  CollectionPagePageProps["tagCategories"]
>[number]
type CollectionTagOption = NonNullable<CollectionTagCategory["options"]>[number]
type CollectionTagOptionId = NonNullable<CollectionTagOption["id"]>

const TagCategoryUsageCount = ({
  siteId,
  pageId,
  tagOptionIds,
}: {
  siteId: number
  pageId: number
  tagOptionIds: CollectionTagOptionId[]
}) => {
  const [{ count }] = trpc.collection.countTagOptionsUsage.useSuspenseQuery({
    siteId,
    pageId,
    tagOptionIds,
  })

  return <>{count}</>
}

function DeleteFilterModal({
  isOpen,
  siteId,
  pageId,
  tagOptionIds,
  label,
  onClose,
  onConfirm,
}: {
  isOpen: boolean
  siteId: number
  pageId: number
  tagOptionIds: CollectionTagOptionId[]
  label: CollectionTagCategory["label"]
  onClose: () => void
  onConfirm: () => void
}) {
  const [isChecked, setIsChecked] = useState(false)

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader mr="3.5rem">
          {label.length > 0 ? `Delete filter "${label}"?` : "Delete filter?"}
        </ModalHeader>
        <ModalCloseButton size="lg" />

        <ModalBody>
          <VStack align="stretch" spacing="1.5rem">
            <Infobox width="100%" size="md" variant="warning">
              <VStack align="stretch" spacing="0rem">
                <Text textStyle="subhead-1" color="base.content.strong">
                  You are deleting an entire filter. It’s being used on{" "}
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
                      <TagCategoryUsageCount
                        siteId={siteId}
                        pageId={pageId}
                        tagOptionIds={tagOptionIds}
                      />
                    </Suspense>
                  </ErrorBoundary>{" "}
                  item(s).
                </Text>
                <Text textStyle="body-1" color="base.content.strong">
                  To undo this change, you will need to recreate this filter and
                  assign options to each item individually.
                </Text>
              </VStack>
            </Infobox>
            <HStack align="start">
              <Checkbox
                isChecked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
              >
                <Text textStyle="body-2">
                  Yes, delete this filter permanently
                </Text>
              </Checkbox>
            </HStack>
          </VStack>
        </ModalBody>

        <ModalFooter>
          <HStack spacing="1rem">
            <Button variant="clear" colorScheme="neutral" onClick={onClose}>
              No, keep filter
            </Button>
            <Button
              isDisabled={!isChecked}
              variant="solid"
              colorScheme="critical"
              onClick={onConfirm}
            >
              Delete filter
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

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
    label: CollectionTagCategory["label"]
    tagOptionIds: CollectionTagOptionId[]
  }>(null)

  const { siteId, pageId } = useQueryParse(pageSchema)

  const isRemoveItemDisabled =
    arraySchema.minItems !== undefined && data <= arraySchema.minItems

  const handleDeleteFilterMenuItemClick = (index: number) => {
    const cat = get(core?.data, composePaths(path, `${index}`)) as
      | Partial<CollectionTagCategory>
      | undefined

    const tagId = cat?.id?.trim()

    // No id means the filter is new and never saved — nothing references it in the DB,
    // so we remove the row immediately instead of opening the usage warning modal.
    if (!tagId) {
      if (!removeItems || isRemoveItemDisabled) return
      removeItems(path, [index])()
      return
    }

    // Persisted filter: show the modal so we can warn about existing item usage before delete.
    setDeleteTarget({
      index,
      label: cat?.label?.trim() ?? "",
      tagOptionIds: compact(map(cat?.options, (o) => o.id?.trim())),
    })
  }

  const closeDeleteModal = () => {
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
        listItemIcon={BiPurchaseTag}
        listItemContentProps={{ py: "0.5rem" }}
        mapNewArrayItem={(item) => ({
          ...(item as Record<string, unknown>),
          // we set this to true by default for new filters
          // we don't set this on JSON Schema because Studio AJV runs with useDefaults, which would apply the
          // same default to legacy rows that omit this key.
          isRequired: true,
        })}
        renderListItemSubtitle={(index) => {
          const count = page?.tagCategories?.[index]?.options?.length ?? 0
          const subtitle =
            count === 0
              ? "No option"
              : `${count} ${count > 1 ? "options" : "option"}`
          return (
            <Text textStyle="caption-2" color="base.content.medium">
              {subtitle}
            </Text>
          )
        }}
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
              aria-label={`Filter ${index + 1} actions`}
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
                    handleDeleteFilterMenuItemClick(index)
                  }}
                >
                  Delete filter
                </MenuItem>
              </MenuList>
            </Portal>
          </Menu>
        )}
        belowDescription={
          hasDuplicateFilterNameError ? (
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
                  Remove duplicate filters before saving.
                </Text>
                <Text textStyle="body-2" color="utility.feedback.critical">
                  Filter names are not case-sensitive.
                </Text>
              </VStack>
            </HStack>
          ) : undefined
        }
        getListItemHasError={(index) => duplicateFilterIndices.has(index)}
        renderListItemErrorCaption={(index) =>
          duplicateFilterIndices.has(index)
            ? "A filter with this name already exists."
            : undefined
        }
      />
      {deleteTarget && (
        <DeleteFilterModal
          isOpen
          siteId={siteId}
          pageId={pageId}
          tagOptionIds={deleteTarget.tagOptionIds}
          label={deleteTarget.label}
          onClose={closeDeleteModal}
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
