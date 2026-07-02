import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import {
  Box,
  chakra,
  Flex,
  HStack,
  Icon,
  Skeleton,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { composePaths, rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { Button } from "@opengovsg/design-system-react"
import {
  resolveCategoryFilterLabel,
  type CollectionPagePageProps,
} from "@opengovsg/isomer-components"
import { get } from "lodash-es"
import { Suspense, useMemo, useState } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { BiInfoCircle, BiPurchaseTag } from "react-icons/bi"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { pageSchema } from "~/features/editing-experience/schema"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { DrawerHeader } from "../../../Drawer/DrawerHeader"
import { AddItemButton } from "../../components/AddItemButton"
import { DeleteConfirmModal } from "../../components/DeleteConfirmModal"
import { DraggableTagButton } from "../../components/DraggableTagButton"
import { DuplicateLabelError } from "../../components/DuplicateLabelError"
import { EmptyCategory } from "../../components/EmptyCategory"
import { NestedDrawerSwitch } from "../../components/NestedDrawerSwitch"
import { TagRowActionsMenu } from "../../components/TagRowActionsMenu"
import { useBuilderErrors } from "../../ErrorProvider"
import { useArray } from "../../hooks/useArray"
import { useDeleteTarget } from "../../hooks/useDeleteTarget"
import { useDuplicateLabels } from "../../hooks/useDuplicateLabels"
import { createDefaultCategoryOption } from "./constants"
import { hasBlankOptionLabel } from "./utils/hasBlankOptionLabel"

/** Matches category option rows from JsonForms (`categoryOptions` array on collection index). */
type CategoryOptionItem = Partial<{
  id: string
  label: string
}>

function CategoryOptionUsageCount({
  siteId,
  indexPageId,
  categoryId,
}: {
  siteId: number
  indexPageId: number
  categoryId: string
}) {
  const [{ count }] =
    trpc.collection.getCategoryOptionUsageCount.useSuspenseQuery({
      siteId,
      indexPageId,
      categoryId,
    })

  return (
    <>
      {count} {count === 1 ? "item" : "items"}
    </>
  )
}

interface CategoryOptionsExpandedEditorProps extends ArrayLayoutProps {
  duplicateOptionIndices: Set<number>
}

function CategoryOptionsExpandedEditor({
  duplicateOptionIndices,
  ...props
}: CategoryOptionsExpandedEditorProps) {
  const {
    data,
    path,
    enabled,
    label,
    addItem,
    removeItems,
    moveUp,
    moveDown,
    arraySchema,
    schema,
    rootSchema,
    uischemas,
    uischema,
    description,
  } = props
  const { hasErrorAt } = useBuilderErrors()
  const { core } = useJsonForms()
  const { pageId, siteId } = useQueryParse(pageSchema)

  const arrayResult = useArray({
    data,
    path,
    arraySchema,
    schema,
    rootSchema,
    uischemas,
    uischema,
    removeItems,
    moveUp,
    moveDown,
  })
  const {
    setSelectedIndex,
    isAddItemDisabled,
    isRemoveItemDisabled,
    childUiSchema,
    handleRemoveSelectedItem,
    onDragEnd,
  } = arrayResult

  const {
    target: deleteTarget,
    openDeleteModal,
    closeDeleteModal,
    handleConfirmDelete,
  } = useDeleteTarget({
    path,
    removeItems,
    isRemoveItemDisabled,
    resolveTarget: (index) => {
      const item = get(core?.data, composePaths(path, `${index}`)) as
        | CategoryOptionItem
        | undefined
      return {
        label: item?.label?.trim() ?? "",
        categoryId: item?.id?.trim() ?? "",
      }
    },
  })

  const handleDeleteOption = (index: number) => {
    const item = get(core?.data, composePaths(path, `${index}`)) as
      | CategoryOptionItem
      | undefined
    const categoryId = item?.id?.trim()

    // New item without a persisted id — remove immediately, no modal needed.
    if (!categoryId) {
      if (!removeItems || isRemoveItemDisabled) return
      removeItems(path, [index])()
      return
    }

    openDeleteModal(index)
  }

  const isBlankLabelAt = (index: number) => {
    const item = get(core?.data, composePaths(path, `${index}`)) as
      | { label?: string }
      | undefined
    return !item?.label?.trim()
  }

  return (
    <NestedDrawerSwitch {...props} {...arrayResult}>
      <VStack align="stretch" spacing={0} w="full">
        <VStack spacing={0} align="start">
          <VStack align="start" spacing="0.25rem" w="full">
            <HStack w="full" justifyContent="space-between" align="center">
              <Text textStyle="subhead-1" flex={1}>
                {label}
              </Text>
              <AddItemButton
                onClick={addItem(path, createDefaultCategoryOption())}
                isDisabled={isAddItemDisabled}
              >
                Add option
              </AddItemButton>
            </HStack>
            {description && (
              <Text textStyle="body-2" textColor="base.content.default">
                {description}
              </Text>
            )}
            {duplicateOptionIndices.size > 0 && (
              <DuplicateLabelError noun="option" />
            )}
          </VStack>
          <Box w="full" mt="0.75rem">
            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="blocks">
                {({ droppableProps, innerRef, placeholder }) => (
                  <VStack
                    {...droppableProps}
                    align="baseline"
                    w="100%"
                    h="100%"
                    spacing={0}
                    ref={innerRef}
                  >
                    {data === 0 && (
                      <EmptyCategory title="Add an option for this category" />
                    )}

                    {[...Array(data).keys()].map((index) => {
                      const childPath = composePaths(path, `${index}`)
                      const isDuplicate = duplicateOptionIndices.has(index)
                      const isBlank = isBlankLabelAt(index)
                      const hasError =
                        hasErrorAt(childPath) || isDuplicate || isBlank

                      return (
                        <Draggable
                          key={childPath}
                          draggableId={childPath}
                          disableInteractiveElementBlocking
                          index={index}
                        >
                          {({ draggableProps, dragHandleProps, innerRef }) => (
                            <DraggableTagButton.Root
                              draggableProps={draggableProps}
                              isError={hasError}
                              ref={innerRef}
                            >
                              <DraggableTagButton.Handle
                                dragHandleProps={dragHandleProps}
                              />
                              <DraggableTagButton.Body
                                onClick={() => setSelectedIndex(index)}
                              >
                                <DraggableTagButton.Content>
                                  <DraggableTagButton.Label
                                    index={index}
                                    path={path}
                                    schema={schema}
                                    uischema={childUiSchema}
                                    enabled={enabled}
                                    removeItem={handleRemoveSelectedItem}
                                  />
                                  {hasError && (
                                    <DraggableTagButton.ErrorCaption>
                                      {isDuplicate
                                        ? "An option with this name already exists."
                                        : isBlank
                                          ? "Option name cannot be empty."
                                          : undefined}
                                    </DraggableTagButton.ErrorCaption>
                                  )}
                                </DraggableTagButton.Content>
                              </DraggableTagButton.Body>
                              <DraggableTagButton.Trailing>
                                <TagRowActionsMenu
                                  noun="option"
                                  index={index}
                                  isDisabled={isRemoveItemDisabled}
                                  onDelete={() => handleDeleteOption(index)}
                                />
                              </DraggableTagButton.Trailing>
                            </DraggableTagButton.Root>
                          )}
                        </Draggable>
                      )
                    })}

                    {placeholder}
                  </VStack>
                )}
              </Droppable>
            </DragDropContext>
          </Box>
        </VStack>
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
                    indexPageId={pageId}
                    categoryId={deleteTarget.categoryId}
                  />
                </Suspense>
              </ErrorBoundary>
              {". "}To undo this change, you will need to create and re-assign
              this option to all items.
            </Text>
          }
          onClose={closeDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </NestedDrawerSwitch>
  )
}

function JsonFormsCategoryOptionsArrayLayoutInner(props: ArrayLayoutProps) {
  const { path, data, enabled } = props
  const { core } = useJsonForms()
  const { hasErrorAt } = useBuilderErrors()
  const [expandedOpen, setExpandedOpen] = useState(false)

  const page = core?.data as CollectionPagePageProps | undefined
  const categoryFilterLabel = resolveCategoryFilterLabel(page?.categoryLabel)

  const items = useMemo(
    () => get(core?.data, path) as { label?: string }[] | undefined,
    [core?.data, path],
  )

  const duplicateOptionIndices = useDuplicateLabels(path)

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
          label={`Edit ${categoryFilterLabel}`}
          isDisabled={cannotLeaveExpandedCategoryOptions}
          onBackClick={handleCloseExpandedCategoryOptions}
          textStyle="subhead-1"
          backAriaLabel={`Return to ${categoryFilterLabel}`}
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
        <Box w="full">
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
                <chakra.button
                  type="button"
                  flex={1}
                  minW={0}
                  display="flex"
                  alignItems="center"
                  cursor="pointer"
                  layerStyle="focusRing"
                  textAlign="start"
                  px="1rem"
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
                          {categoryFilterLabel}
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
                </chakra.button>
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

  return (
    <VStack align="start" spacing="1rem" w="full">
      <Text textStyle="subhead-2" textColor="base.content.strong">
        Default Filter
      </Text>
      <JsonFormsCategoryOptionsArrayLayout {...props} />
    </VStack>
  )
}

export default JsonFormsCategoryOptionsControl
