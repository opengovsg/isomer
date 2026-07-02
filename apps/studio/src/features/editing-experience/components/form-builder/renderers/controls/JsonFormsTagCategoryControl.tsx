import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import type { CollectionPagePageProps } from "@opengovsg/isomer-components"
import { Box, HStack, Skeleton, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { composePaths, rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { Suspense, useMemo } from "react"
import { ErrorBoundary } from "react-error-boundary"
import { BiPurchaseTag } from "react-icons/bi"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { pageSchema } from "~/features/editing-experience/schema"
import { useQueryParse } from "~/hooks/useQueryParse"
import { trpc } from "~/utils/trpc"

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
import { createDefaultTagCategory } from "./constants"

function TagCategoryUsageCount({
  siteId,
  pageId,
  tagOptionIds,
}: {
  siteId: number
  pageId: number
  tagOptionIds: string[]
}) {
  if (tagOptionIds.length === 0) {
    return <>0 items</>
  }

  const [{ count }] = trpc.collection.countTagOptionsUsage.useSuspenseQuery({
    siteId,
    pageId,
    tagOptionIds,
  })

  return <>{count === 1 ? "1 item" : `${count} items`}</>
}

function JsonFormsTagCategoriesArrayLayoutInner(props: ArrayLayoutProps) {
  const {
    data,
    path,
    enabled,
    addItem,
    removeItems,
    arraySchema,
    schema,
    rootSchema,
    uischemas,
    uischema,
    moveUp,
    moveDown,
    label,
    description,
  } = props
  const { hasErrorAt } = useBuilderErrors()
  const { core } = useJsonForms()
  const { pageId, siteId } = useQueryParse(pageSchema)
  const page = core?.data as CollectionPagePageProps | undefined
  const duplicateFilterIndices = useDuplicateLabels(path)

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

  const hasDuplicateFilterNameError = duplicateFilterIndices.size > 0

  const {
    target: deleteTarget,
    openDeleteModal,
    closeDeleteModal,
    handleConfirmDelete,
  } = useDeleteTarget({
    path,
    removeItems,
    isRemoveItemDisabled,
    resolveTarget: (index) => ({
      label: page?.tagCategories?.[index]?.label?.trim() ?? "",
    }),
  })

  const deleteTargetTagOptionIds = useMemo(() => {
    if (!deleteTarget) return []
    return (
      page?.tagCategories?.[deleteTarget.index]?.options
        ?.map((option) => option.id)
        .filter((id): id is string => Boolean(id)) ?? []
    )
  }, [deleteTarget, page?.tagCategories])

  return (
    <NestedDrawerSwitch {...props} {...arrayResult}>
      <VStack spacing={0} align="start">
        <VStack align="start" spacing="0.25rem" w="full">
          <HStack w="full" justifyContent="space-between" align="center">
            <Text textStyle="subhead-1" flex={1}>
              {label}
            </Text>
            <AddItemButton
              onClick={addItem(path, createDefaultTagCategory())}
              isDisabled={isAddItemDisabled}
            >
              Add a filter
            </AddItemButton>
          </HStack>
          {description && (
            <Text textStyle="body-2" textColor="base.content.default">
              {description}
            </Text>
          )}
          {hasDuplicateFilterNameError && <DuplicateLabelError noun="filter" />}
        </VStack>
        <Box w="full" mt={description ? "0.75rem" : "0.25rem"}>
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
                    <EmptyCategory
                      title="Filters you add will appear here"
                      description="Click 'Add a filter' to add one"
                    />
                  )}

                  {[...Array(data).keys()].map((index) => {
                    const childPath = composePaths(path, `${index}`)
                    const isDuplicate = duplicateFilterIndices.has(index)
                    const hasError = hasErrorAt(childPath) || isDuplicate
                    const count =
                      page?.tagCategories?.[index]?.options?.length ?? 0
                    const subtitle =
                      count === 1 ? "1 option" : `${count} options`

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
                              <DraggableTagButton.Icon icon={BiPurchaseTag} />
                              <DraggableTagButton.Content>
                                <DraggableTagButton.Label
                                  index={index}
                                  path={path}
                                  schema={schema}
                                  uischema={childUiSchema}
                                  enabled={enabled}
                                  removeItem={handleRemoveSelectedItem}
                                />
                                <DraggableTagButton.Subtitle>
                                  {subtitle}
                                </DraggableTagButton.Subtitle>
                                {hasError && (
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
                                index={index}
                                isDisabled={isRemoveItemDisabled}
                                onDelete={() => openDeleteModal(index)}
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
      {deleteTarget && (
        <DeleteConfirmModal
          isOpen
          label={deleteTarget.label}
          noun="filter"
          title={
            <Text textStyle="subhead-1" color="base.content.strong">
              You are deleting an entire filter. It&apos;s being used on{" "}
              <ErrorBoundary fallbackRender={() => <>— items</>}>
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
                    tagOptionIds={deleteTargetTagOptionIds}
                  />
                </Suspense>
              </ErrorBoundary>
            </Text>
          }
          warningBody={
            <Text textStyle="body-1" color="base.content.strong">
              To undo this change, you will need to recreate this filter and
              assign options to each item individually.
            </Text>
          }
          confirmCheckboxLabel="Yes, delete the entire filter permanently"
          onClose={closeDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      )}
    </NestedDrawerSwitch>
  )
}

export const jsonFormsTagCategoriesControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.TagCategoryControl,
  schemaMatches((schema) => schema.format === "tag-categories"),
)

export default withJsonFormsArrayLayoutProps(
  JsonFormsTagCategoriesArrayLayoutInner,
)
