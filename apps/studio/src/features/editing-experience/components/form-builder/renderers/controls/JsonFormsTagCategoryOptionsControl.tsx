import type { DropResult } from "@hello-pangea/dnd"
import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import { Box, Flex, HStack, Text, VStack } from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import {
  composePaths,
  createDefaultValue,
  findUISchema,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import { Button } from "@opengovsg/design-system-react"
import { get } from "lodash-es"
import { useCallback, useMemo, useState } from "react"
import { BiPlusCircle } from "react-icons/bi"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { ComplexEditorNestedDrawer } from "../../components/ComplexEditorNestedDrawer"
import { DeleteConfirmModal } from "../../components/DeleteConfirmModal"
import DraggableTagButton from "../../components/DraggableTagButton"
import { DuplicateLabelError } from "../../components/DuplicateLabelError"
import { useBuilderErrors } from "../../ErrorProvider"
import { TagRowActionsMenu } from "./TagRowActionsMenu"
import { indicesWithDuplicateLabels } from "./utils/indicesWithDuplicateLabels"

const JsonFormsTagCategoryOptionsArrayLayoutInner = (
  props: ArrayLayoutProps,
) => {
  const {
    data,
    path,
    visible,
    enabled,
    label,
    addItem,
    removeItems,
    moveUp,
    moveDown,
    arraySchema,
    schema,
    rootSchema,
    renderers,
    cells,
    uischemas,
    uischema,
    description,
  } = props
  const { hasErrorAt } = useBuilderErrors()
  const { core } = useJsonForms()
  const items = get(core?.data, path) as { label?: string }[] | undefined
  const duplicateOptionIndices = useMemo(
    () => indicesWithDuplicateLabels(items),
    [items],
  )

  const [deleteTarget, setDeleteTarget] = useState<null | {
    index: number
    label: string
    tagId?: string
  }>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>()

  const isRemoveItemDisabled =
    arraySchema.minItems !== undefined && data <= arraySchema.minItems

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

  const handleRemoveItem = useCallback(
    (path: string, index: number) => () => {
      if (selectedIndex === undefined || !removeItems || isRemoveItemDisabled) {
        return
      }

      removeItems(path, [index])()

      if (selectedIndex === index) {
        setSelectedIndex(undefined)
      } else if (selectedIndex > index) {
        setSelectedIndex(selectedIndex - 1)
      }
    },
    [isRemoveItemDisabled, removeItems, selectedIndex],
  )
  const handleMoveItem = useCallback(
    (path: string, originalIndex: number, newIndex: number) => {
      if (originalIndex === newIndex || !moveDown || !moveUp) {
        return
      }

      if (originalIndex < newIndex) {
        for (let i = originalIndex; i < newIndex; i++) {
          moveDown(path, i)()
        }
      } else {
        for (let i = originalIndex; i > newIndex; i--) {
          moveUp(path, i)()
        }
      }
    },
    [moveUp, moveDown],
  )

  const childUiSchema = useMemo(
    () =>
      findUISchema(
        uischemas ?? [],
        schema,
        uischema.scope,
        path,
        undefined,
        uischema,
        rootSchema,
      ),
    [uischemas, schema, uischema, path, rootSchema],
  )
  const onDragEnd = useCallback(
    (result: DropResult) => {
      if (!result.destination) {
        return
      }
      handleMoveItem(path, result.source.index, result.destination.index)
    },
    [path, handleMoveItem],
  )

  if (selectedIndex !== undefined) {
    return (
      <ComplexEditorNestedDrawer
        renderers={renderers}
        cells={cells}
        visible={visible}
        schema={schema}
        uischema={childUiSchema}
        path={composePaths(path, `${selectedIndex}`)}
        label={label}
        setSelectedIndex={setSelectedIndex}
        isRemoveItemDisabled={isRemoveItemDisabled}
        handleRemoveItem={handleRemoveItem(path, selectedIndex)}
        selectedIndex={selectedIndex}
        maxIndex={data - 1}
      />
    )
  }

  return (
    <>
      {duplicateOptionIndices.size > 0 && <DuplicateLabelError noun="option" />}
      <VStack spacing={0} align="start">
        <VStack align="start" spacing="0.25rem" w="full">
          <HStack w="full" justifyContent="space-between" align="center">
            <Text textStyle="subhead-1" flex={1}>
              {label}
            </Text>
            <Button
              onClick={addItem(path, createDefaultValue(schema, rootSchema))}
              variant="clear"
              size="xs"
              leftIcon={<BiPlusCircle fontSize="1.25rem" />}
              isDisabled={
                arraySchema.maxItems !== undefined &&
                data >= arraySchema.maxItems
              }
              flexShrink={0}
            >
              Add option
            </Button>
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
                    <Flex
                      alignItems="center"
                      flexDir="column"
                      px="1.5rem"
                      py="3.75rem"
                      mt="0.25rem"
                      justifyContent="center"
                      w="100%"
                    >
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
                          Users will choose from this list when creating new
                          items.
                        </Text>
                      </VStack>
                    </Flex>
                  )}

                  {[...Array(data).keys()].map((index) => {
                    const childPath = composePaths(path, `${index}`)
                    const isDuplicate = duplicateOptionIndices.has(index)
                    const hasError = hasErrorAt(childPath) || isDuplicate

                    return (
                      <Draggable
                        key={childPath}
                        draggableId={childPath}
                        disableInteractiveElementBlocking
                        index={index}
                      >
                        {({ draggableProps, dragHandleProps, innerRef }) => (
                          <DraggableTagButton
                            draggableProps={draggableProps}
                            dragHandleProps={dragHandleProps}
                            isError={hasError}
                            ref={innerRef}
                            index={index}
                            path={path}
                            schema={schema}
                            enabled={enabled}
                            handleSelect={() => () => undefined}
                            removeItem={handleRemoveItem}
                            selected={false}
                            uischema={childUiSchema}
                            childLabelProp={undefined}
                            translations={{}}
                            setSelectedIndex={setSelectedIndex}
                            listItemTrailing={
                              <TagRowActionsMenu
                                noun="option"
                                index={index}
                                isDisabled={isRemoveItemDisabled}
                                onDelete={() => openDeleteModal(index)}
                              />
                            }
                            listItemErrorCaption={
                              isDuplicate
                                ? "An option with this name already exists."
                                : undefined
                            }
                          />
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
