import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import type { CollectionPagePageProps } from "@opengovsg/isomer-components"
import { Box, HStack, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import { composePaths, rankWith, schemaMatches } from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { isDateFilter, isTextFilter } from "@opengovsg/isomer-components"
import { useMemo, useState } from "react"
import { BiCalendar, BiPurchaseTag } from "react-icons/bi"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { pageSchema } from "~/features/editing-experience/schema"
import { useDateFiltersEnabled } from "~/hooks/useDateFiltersEnabled"
import { useQueryParse } from "~/hooks/useQueryParse"

import type { FilterType } from "../../components/FilterTypeChoiceModal"
import { AddItemButton } from "../../components/AddItemButton"
import { DeleteFilterModal } from "../../components/DeleteFilterModal"
import { DraggableTagButton } from "../../components/DraggableTagButton"
import { EmptyCategory } from "../../components/EmptyCategory"
import { FilterTypeChoiceModal } from "../../components/FilterTypeChoiceModal"
import { NestedDrawerSwitch } from "../../components/NestedDrawerSwitch"
import { TagRowActionsMenu } from "../../components/TagRowActionsMenu"
import { useBuilderErrors } from "../../ErrorProvider"
import { useArray } from "../../hooks/useArray"
import { useDeleteTarget } from "../../hooks/useDeleteTarget"
import { useLiveLabelIssues } from "../../hooks/useLiveLabelIssues"
import { createDefaultDateFilter, createDefaultTagCategory } from "./constants"

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
  const { duplicate: duplicateFilterIndices } = useLiveLabelIssues({ path })
  const [isTypeChoiceModalOpen, setIsTypeChoiceModalOpen] = useState(false)
  const isDateFiltersEnabled = useDateFiltersEnabled()

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
    resolveTarget: (index) => ({
      label: page?.tagCategories?.[index]?.label?.trim() ?? "",
    }),
  })

  const deleteFilterModalTarget = useMemo(():
    | { type: "text"; tagOptionIds: string[] }
    | { type: "date"; dateFilterId: string }
    | undefined => {
    if (!deleteTarget) return undefined

    const tagCategory = page?.tagCategories?.[deleteTarget.index]
    if (tagCategory && isDateFilter(tagCategory)) {
      return { type: "date", dateFilterId: tagCategory.id }
    }

    return {
      type: "text",
      tagOptionIds:
        tagCategory && isTextFilter(tagCategory)
          ? tagCategory.options
              .map((option) => option.id)
              .filter((id): id is string => Boolean(id))
          : [],
    }
  }, [deleteTarget, page?.tagCategories])

  const handleAddFilter = (type: FilterType) => {
    const newIndex = data
    addItem(
      path,
      type === "date" ? createDefaultDateFilter() : createDefaultTagCategory(),
    )()
    setSelectedIndex(newIndex)
    setIsTypeChoiceModalOpen(false)
  }

  return (
    <NestedDrawerSwitch {...props} {...arrayResult}>
      <VStack spacing={0} align="start">
        <VStack align="start" spacing="0.25rem" w="full">
          <HStack w="full" justifyContent="space-between" align="center">
            <Text textStyle="subhead-1" flex={1}>
              {label}
            </Text>
            <AddItemButton
              onClick={() =>
                isDateFiltersEnabled
                  ? setIsTypeChoiceModalOpen(true)
                  : handleAddFilter("text")
              }
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
                    const tagCategory = page?.tagCategories?.[index]
                    const isDateFilterEntry =
                      !!tagCategory && isDateFilter(tagCategory)
                    const count =
                      tagCategory && isTextFilter(tagCategory)
                        ? tagCategory.options.length
                        : 0
                    const subtitle = isDateFilterEntry
                      ? "Date filter"
                      : count === 1
                        ? "1 option"
                        : `${count} options`

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
                              <DraggableTagButton.Icon
                                icon={
                                  isDateFilterEntry ? BiCalendar : BiPurchaseTag
                                }
                              />
                              <DraggableTagButton.Content>
                                <DraggableTagButton.Label
                                  index={index}
                                  path={path}
                                  schema={schema}
                                  uischema={childUiSchema}
                                  enabled={enabled}
                                  removeItem={handleRemoveSelectedItem}
                                  // NOTE: `schema` here is the oneOf-wrapped
                                  // TagCategorySchema (see
                                  // JsonFormsTagCategoryItemControl) — it has
                                  // no top-level `properties`, so JSONForms'
                                  // default "first primitive property"
                                  // fallback can't find a label to show
                                  // without this explicit hint.
                                  childLabelProp="label"
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
      {deleteTarget && deleteFilterModalTarget && (
        <DeleteFilterModal
          isOpen
          siteId={siteId}
          pageId={pageId}
          target={deleteFilterModalTarget}
          onClose={closeDeleteModal}
          onConfirm={handleConfirmDelete}
        />
      )}
      <FilterTypeChoiceModal
        isOpen={isTypeChoiceModalOpen}
        onClose={() => setIsTypeChoiceModalOpen(false)}
        onSelect={handleAddFilter}
        isDateFilterEnabled={isDateFiltersEnabled}
      />
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
