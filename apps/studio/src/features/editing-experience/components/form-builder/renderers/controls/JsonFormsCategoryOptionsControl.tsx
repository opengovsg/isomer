import type { DropResult } from "@hello-pangea/dnd"
import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import {
  Box,
  Flex,
  HStack,
  Icon,
  MenuButton,
  MenuList,
  Portal,
  Stack,
  Text,
  VStack,
} from "@chakra-ui/react"
import { DragDropContext, Draggable, Droppable } from "@hello-pangea/dnd"
import {
  composePaths,
  createDefaultValue,
  findUISchema,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import { useJsonForms, withJsonFormsArrayLayoutProps } from "@jsonforms/react"
import {
  Button,
  IconButton,
  Infobox,
  Menu,
} from "@opengovsg/design-system-react"
import { get } from "lodash-es"
import { useCallback, useMemo, useState } from "react"
import {
  BiDotsHorizontalRounded,
  BiGridVertical,
  BiInfoCircle,
  BiPlusCircle,
  BiPurchaseTag,
  BiTrash,
} from "react-icons/bi"
import { MenuItem } from "~/components/Menu"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { useIsUserIsomerAdmin } from "~/hooks/useIsUserIsomerAdmin"
import { IsomerAdminRole } from "~prisma/generated/generatedEnums"

import { DrawerHeader } from "../../../Drawer/DrawerHeader"
import { ComplexEditorNestedDrawer } from "../../components/ComplexEditorNestedDrawer"
import { DeleteConfirmModal } from "../../components/DeleteConfirmModal"
import { DraggableTagButton } from "../../components/DraggableTagButton"
import { DuplicateLabelError } from "../../components/DuplicateLabelError"
import { useBuilderErrors } from "../../ErrorProvider"
import { ROW_ACTIONS_MENU_BUTTON_PROPS } from "./constants"
import { hasBlankOptionLabel } from "./utils/hasBlankOptionLabel"
import { indicesWithDuplicateLabels } from "./utils/indicesWithDuplicateLabels"

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

  const isRemoveItemDisabled =
    arraySchema.minItems !== undefined && data <= arraySchema.minItems

  const [deleteTarget, setDeleteTarget] = useState<null | {
    index: number
    label: string
  }>(null)
  const [selectedIndex, setSelectedIndex] = useState<number>()

  const openDeleteModal = (index: number) => {
    const item = get(core?.data, composePaths(path, `${index}`)) as
      | { label?: string; id?: string }
      | undefined
    setDeleteTarget({
      index,
      label: item?.label?.trim() ?? "",
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

  const arrayBody =
    selectedIndex !== undefined ? (
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
    ) : (
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
                          Add an option for this category
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
                                  handleSelect={() => () => undefined}
                                  removeItem={handleRemoveItem}
                                  selected={false}
                                  childLabelProp={undefined}
                                  translations={{}}
                                />
                                {hasError && (
                                  <DraggableTagButton.ErrorCaption>
                                    {isDuplicate
                                      ? "An option with this name already exists."
                                      : undefined}
                                  </DraggableTagButton.ErrorCaption>
                                )}
                              </DraggableTagButton.Content>
                            </DraggableTagButton.Body>
                            <DraggableTagButton.Trailing>
                              <Menu isLazy>
                                <MenuButton
                                  as={IconButton}
                                  icon={
                                    <BiDotsHorizontalRounded fontSize="1.5rem" />
                                  }
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
                                        openDeleteModal(index)
                                      }}
                                    >
                                      Delete option
                                    </MenuItem>
                                  </MenuList>
                                </Portal>
                              </Menu>
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
    )

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
        {arrayBody}
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

function JsonFormsCategoryOptionsArrayLayoutInner(props: ArrayLayoutProps) {
  const { path, data, enabled } = props
  const { core } = useJsonForms()
  const { hasErrorAt } = useBuilderErrors()
  const [expandedOpen, setExpandedOpen] = useState(false)

  const duplicateOptionIndices = useMemo(() => {
    const items = get(core?.data, path) as { label?: string }[] | undefined
    return indicesWithDuplicateLabels(items)
  }, [core?.data, path])

  const cannotLeaveExpandedCategoryOptions = useMemo(() => {
    const items = get(core?.data, path) as { label?: string }[] | undefined
    return (
      hasBlankOptionLabel(items) ||
      duplicateOptionIndices.size > 0 ||
      hasErrorAt(path)
    )
  }, [core?.data, path, duplicateOptionIndices, hasErrorAt])

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
