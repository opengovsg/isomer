import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import {
  Box,
  Flex,
  HStack,
  Icon,
  MenuButton,
  MenuList,
  Portal,
  Skeleton,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { composePaths, rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import {
  Button,
  IconButton,
  Infobox,
  Menu,
} from "@opengovsg/design-system-react"
import { get } from "lodash-es"
import { Suspense, useMemo, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import {
  BiDotsHorizontalRounded,
  BiGridVertical,
  BiInfoCircle,
  BiPurchaseTag,
  BiTrash,
} from "react-icons/bi"
import { MenuItem } from "~/components/Menu"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { pageSchema } from "~/features/editing-experience/schema"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { DrawerHeader } from "../../../Drawer/DrawerHeader"
import { useBuilderErrors } from "../../ErrorProvider"
import { ROW_ACTIONS_MENU_BUTTON_PROPS } from "./constants"
import { DeleteConfirmModal } from "./DeleteConfirmModal"
import { DuplicateLabelError } from "./DuplicateLabelError"
import { JsonFormsArrayControlView } from "./JsonFormsArrayControl"
import { hasBlankOptionLabel } from "./utils/hasBlankOptionLabel"
import { indicesWithDuplicateLabels } from "./utils/indicesWithDuplicateLabels"

/** Matches category option rows from JsonForms (`categoryOptions` array on collection index). */
type CategoryOptionItem = Partial<{
  id: string
  label: string
}>

function CategoryOptionUsageCount({
  siteId,
  pageId,
  categoryId,
}: {
  siteId: number
  pageId: number
  categoryId: string
}) {
  const [{ count }] =
    trpc.collection.getCategoryOptionUsageCount.useSuspenseQuery({
      siteId,
      pageId,
      categoryId,
    })

  return <>{count}</>
}

interface CategoryOptionsExpandedEditorProps extends ArrayLayoutProps {
  duplicateOptionIndices: Set<number>
}

function CategoryOptionsExpandedEditor({
  duplicateOptionIndices,
  ...props
}: CategoryOptionsExpandedEditorProps) {
  const { path, removeItems, data, arraySchema } = props
  const { core } = useJsonForms()
  const { pageId, siteId } = useQueryParse(pageSchema)

  const isRemoveItemDisabled =
    arraySchema.minItems !== undefined && data <= arraySchema.minItems

  const [deleteTarget, setDeleteTarget] = useState<null | {
    index: number
    label: string
    categoryId: string
  }>(null)

  const handleDeleteOptionMenuItemClick = (index: number) => {
    const item = get(core?.data, composePaths(path, `${index}`)) as
      | CategoryOptionItem
      | undefined

    const categoryId = item?.id?.trim()

    // No id means the option is new and never saved — nothing references it in the DB,
    // so we remove the row immediately instead of opening the usage warning modal.
    if (!categoryId) {
      if (!removeItems || isRemoveItemDisabled) return
      removeItems(path, [index])()
      return
    }

    // Persisted option: show the modal so we can warn about existing item usage before delete.
    setDeleteTarget({
      index,
      label: item?.label?.trim() ?? "",
      categoryId,
    })
  }

  const handleConfirmDelete = () => {
    if (!deleteTarget || !removeItems || isRemoveItemDisabled) return
    removeItems(path, [deleteTarget.index])()
    setDeleteTarget(null)
  }

  return (
    <>
      <VStack align="stretch" spacing={0} w="full">
        <Infobox
          width="100%"
          size="md"
          variant="warning"
          mb="1.25rem"
          border="1px solid"
          borderColor="utility.feedback.warning"
        >
          <Text textStyle="body-2" color="base.content.strong">
            This is the default filter, so you can't change its name or make it
            optional.
          </Text>
        </Infobox>
        <JsonFormsArrayControlView
          {...props}
          addItemLabel="Add option"
          listItemContentProps={{ py: "0.5rem" }}
          renderListItemTrailing={(index) => (
            <Menu isLazy>
              <MenuButton
                as={IconButton}
                icon={<BiDotsHorizontalRounded fontSize="1.5rem" />}
                {...ROW_ACTIONS_MENU_BUTTON_PROPS}
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
            duplicateOptionIndices.size > 0 && (
              <DuplicateLabelError noun="option" />
            )
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
                Add an option for this category
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
      </VStack>
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen
          label={deleteTarget.label}
          noun="option"
          warningBody={
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
                  <CategoryOptionUsageCount
                    siteId={siteId}
                    pageId={pageId}
                    categoryId={deleteTarget.categoryId}
                  />
                </Suspense>
              </ErrorBoundary>{" "}
              items. To undo this change, you will need to create and re-assign
              this option to all items.
            </Text>
          }
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleConfirmDelete}
        />
      )}
    </>
  )
}

function JsonFormsCategoryOptionsArrayLayoutInner(props: ArrayLayoutProps) {
  const { path, data, enabled } = props
  const { core } = useJsonForms()
  const { hasErrorAt } = useBuilderErrors()
  const [expandedOpen, setExpandedOpen] = useState(false)

  const items = useMemo(
    () => get(core?.data, path) as { label?: string }[] | undefined,
    [core?.data, path],
  )

  const duplicateOptionIndices = useMemo(
    () => indicesWithDuplicateLabels(items),
    [items],
  )

  const cannotLeaveExpandedCategoryOptions = useMemo(
    () =>
      hasBlankOptionLabel(items) ||
      duplicateOptionIndices.size > 0 ||
      hasErrorAt(path),
    [items, path, duplicateOptionIndices, hasErrorAt],
  )

  const handleCloseExpandedCategoryOptions = () => {
    if (cannotLeaveExpandedCategoryOptions) return
    setExpandedOpen(false)
  }

  if (expandedOpen) {
    return (
      <VStack
        position="absolute"
        top={0}
        left={0}
        bg="grey.50"
        w="100%"
        h="100%"
        zIndex={1}
        gap={0}
      >
        <DrawerHeader
          label="Edit Category"
          isDisabled={cannotLeaveExpandedCategoryOptions}
          onBackClick={handleCloseExpandedCategoryOptions}
          textStyle="subhead-1"
          backAriaLabel="Return to Category"
        />
        <Box w="100%" flex={1} minH={0} px="1.5rem" py="1rem" overflow="auto">
          <CategoryOptionsExpandedEditor
            {...props}
            duplicateOptionIndices={duplicateOptionIndices}
          />
        </Box>
        <Box
          bgColor="base.canvas.default"
          boxShadow="md"
          py="1.5rem"
          px="2rem"
          w="full"
        >
          <Button
            w="100%"
            isDisabled={cannotLeaveExpandedCategoryOptions}
            aria-label="Save category options"
            onClick={handleCloseExpandedCategoryOptions}
          >
            Save changes
          </Button>
        </Box>
      </VStack>
    )
  }

  return (
    <Box position="relative" w="full">
      <VStack spacing={0} align="stretch" w="full">
        {duplicateOptionIndices.size > 0 && (
          <DuplicateLabelError noun="option" />
        )}
        <Box w="full" mt="-1.25rem">
          <Box my="0.25rem" w="full">
            <HStack
              spacing={0}
              border="1px solid"
              borderColor="base.divider.medium"
              borderRadius="6px"
              bg="white"
              transitionProperty="common"
              transitionDuration="normal"
              aria-invalid={duplicateOptionIndices.size > 0}
              _hover={{
                bg: "interaction.muted.main.hover",
                borderColor: "interaction.main-subtle.hover",
                _invalid: {
                  bg: "interaction.muted.critical.hover",
                  borderColor: "utility.feedback.critical",
                },
              }}
              _active={{
                bg: "interaction.main-subtle.default",
                borderColor: "interaction.main-subtle.hover",
                shadow: "0px 1px 6px 0px #1361F026",
                _invalid: {
                  bg: "interaction.muted.critical.hover",
                  borderColor: "utility.feedback.critical",
                  shadow: "0px 1px 6px 0px #C0343426",
                },
              }}
              align="stretch"
              overflow="hidden"
            >
              {duplicateOptionIndices.size > 0 && (
                <Box
                  aria-hidden
                  bg="utility.feedback.critical"
                  width="6px"
                  mr="-6px"
                />
              )}
              <HStack flex={1} align="stretch" spacing={0} minW={0} w="100%">
                <Flex
                  flexShrink={0}
                  align="center"
                  alignSelf="stretch"
                  pl="0.5rem"
                  pr="0.25rem"
                  cursor="not-allowed"
                  pointerEvents="none"
                  userSelect="none"
                  aria-hidden
                  py="0.5rem"
                >
                  <Icon
                    as={BiGridVertical}
                    fontSize="1.5rem"
                    color="interaction.support.disabled"
                    aria-hidden
                  />
                </Flex>
                <Box
                  as="button"
                  type="button"
                  flex={1}
                  minW={0}
                  display="flex"
                  alignItems="center"
                  cursor="pointer"
                  layerStyle="focusRing"
                  textAlign="start"
                  pl="0.25rem"
                  pr="1rem"
                  onClick={() => setExpandedOpen(true)}
                  disabled={!enabled}
                  py="0.5rem"
                >
                  <HStack align="stretch" spacing="0.75rem" w="full">
                    <Flex
                      p="0.25rem"
                      bg="interaction.main-subtle.default"
                      borderRadius="0.25rem"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                      alignSelf="center"
                    >
                      <Icon
                        as={BiPurchaseTag}
                        fontSize="0.75rem"
                        color="base.content.default"
                        aria-hidden
                      />
                    </Flex>
                    <Stack align="start" gap="0.25rem" flex={1} minW={0}>
                      <HStack
                        spacing="0.375rem"
                        align="baseline"
                        flexWrap="wrap"
                      >
                        <Text textStyle="subhead-2" textAlign="start">
                          Category
                        </Text>
                        <Text
                          as="span"
                          textStyle="subhead-2"
                          color="interaction.support.placeholder"
                        >
                          (Default)
                        </Text>
                      </HStack>
                      <Text textStyle="caption-2" color="base.content.medium">
                        {data === 0
                          ? "No options"
                          : `${data} ${data > 1 ? "options" : "option"}`}
                      </Text>
                      {duplicateOptionIndices.size > 0 && (
                        <Text
                          as="span"
                          textStyle="caption-2"
                          color="utility.feedback.critical"
                          display="flex"
                          alignItems="center"
                        >
                          <Icon
                            aria-hidden
                            as={BiInfoCircle}
                            fontSize="0.75rem"
                            mr="0.25rem"
                          />
                          Duplicate option names must be fixed before saving.
                        </Text>
                      )}
                    </Stack>
                  </HStack>
                </Box>
                <Flex
                  alignItems="center"
                  flexShrink={0}
                  p="0.5rem"
                  pointerEvents="none"
                  userSelect="none"
                  aria-hidden
                >
                  <Flex
                    align="center"
                    justifyContent="center"
                    h="2.125rem"
                    w="2.125rem"
                    minH="2.125rem"
                    minW="2.125rem"
                    p="0.25rem"
                  >
                    <Icon
                      as={BiDotsHorizontalRounded}
                      fontSize="1.5rem"
                      color="interaction.support.disabled"
                      aria-hidden
                    />
                  </Flex>
                </Flex>
              </HStack>
            </HStack>
          </Box>
        </Box>
      </VStack>
    </Box>
  )
}

const JsonFormsCategoryOptionsArrayLayout = withJsonFormsArrayLayoutProps(
  JsonFormsCategoryOptionsArrayLayoutInner,
)

export const jsonFormsCategoryOptionsControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.CategoryOptionsControl,
  schemaMatches((schema) => schema.format === "category-options"),
)

const JsonFormsCategoryOptionsControl = (props: ArrayLayoutProps) => {
  const { isAdmin: isUserIsomerAdmin } = useIsUserIsomerAdmin({
    roles: [IsomerAdminRole.Core, IsomerAdminRole.Migrator],
  })

  if (!isUserIsomerAdmin) {
    return null
  }

  return <JsonFormsCategoryOptionsArrayLayout {...props} />
}

export default JsonFormsCategoryOptionsControl
