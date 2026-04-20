import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import type { CollectionPagePageProps } from "@opengovsg/isomer-components"
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
import { rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import {
  Button,
  Checkbox,
  IconButton,
  Infobox,
  Menu,
  ModalCloseButton,
} from "@opengovsg/design-system-react"
import { useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { BiDotsHorizontalRounded, BiPurchaseTag, BiTrash } from "react-icons/bi"
import { MenuItem } from "~/components/Menu"
import Suspense from "~/components/Suspense"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { pageSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"

import { useBuilderErrors } from "../../ErrorProvider"
import { JsonFormsArrayControlView } from "./JsonFormsArrayControl"
import { hasUniqueItemPropertiesError } from "./utils/hasUniqueItemPropertiesError"

const TagCategoryUsageCount = ({
  siteId,
  pageId,
  tagCategory,
}: {
  siteId: number
  pageId: number
  tagCategory: { label: string; id: string }
}) => {
  const [{ count }] = trpc.collection.countTagCategoryUsage.useSuspenseQuery({
    siteId,
    pageId,
    tagCategory,
  })

  return <>{count ?? "—"}</>
}

function DeleteFilterModal({
  isOpen,
  siteId,
  pageId,
  tagCategory,
  label,
  onClose,
  onConfirm,
}: {
  isOpen: boolean
  siteId: number
  pageId: number
  tagCategory?: { label: string; id?: string }
  label: string
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
                  {!tagCategory?.id ? (
                    "—"
                  ) : (
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
                          tagCategory={{
                            label: tagCategory.label,
                            id: tagCategory.id,
                          }}
                        />
                      </Suspense>
                    </ErrorBoundary>
                  )}{" "}
                  items.
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

  const hasDuplicateFilterNameError = hasUniqueItemPropertiesError({
    errors,
    jsonFormsPath: path,
  })

  const [deleteTarget, setDeleteTarget] = useState<null | {
    index: number
    label: string
    tagCategory?: { label: string; id?: string }
  }>(null)

  const { siteId, pageId } = useQueryParse(pageSchema)

  const isRemoveItemDisabled =
    arraySchema.minItems !== undefined && data <= arraySchema.minItems

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
              aria-label="Filter actions"
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
                    const cat = page?.tagCategories?.[index]
                    setDeleteTarget({
                      index,
                      label: cat?.label?.trim() ?? "",
                      tagCategory: cat
                        ? { label: cat.label?.trim() ?? "", id: cat.id }
                        : undefined,
                    })
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
            <Infobox width="100%" size="sm" variant="error" mt="0.5rem">
              <Text textStyle="body-2">
                Each filter must have a unique name. Names are not
                case-sensitive, so rename the duplicate before saving changes.
              </Text>
            </Infobox>
          ) : undefined
        }
      />
      {deleteTarget && (
        <DeleteFilterModal
          isOpen
          siteId={siteId}
          pageId={pageId}
          tagCategory={deleteTarget.tagCategory}
          label={deleteTarget.label}
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
