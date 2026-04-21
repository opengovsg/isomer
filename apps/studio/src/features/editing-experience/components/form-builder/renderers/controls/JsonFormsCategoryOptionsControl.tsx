import type { ArrayLayoutProps, RankedTester } from "@jsonforms/core"
import {
  Box,
  Flex,
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
  Stack,
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
import {
  BiDotsHorizontalRounded,
  BiGridVertical,
  BiInfoCircle,
  BiPurchaseTag,
  BiSolidErrorCircle,
  BiTrash,
} from "react-icons/bi"
import { MenuItem } from "~/components/Menu"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { DrawerHeader } from "../../../Drawer/DrawerHeader"
import { useBuilderErrors } from "../../ErrorProvider"
import { JsonFormsArrayControlView } from "./JsonFormsArrayControl"
import { hasUniqueItemPropertiesError } from "./utils/hasUniqueItemPropertiesError"
import { indicesWithDuplicateLabels } from "./utils/indicesWithDuplicateLabels"

/** Duplicated from tag filter options modal; diverge copy/behaviour for category options when needed. */
const DeleteCategoryOptionModal = ({
  isOpen,
  label,
  onClose,
  onConfirm,
}: {
  isOpen: boolean
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
                {/* TODO: replace XX with usage count from backend */}
                This option is being used in XX items. To undo this change, you
                will need to create and re-assign this option to all items.
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

function CategoryOptionsExpandedEditor(props: ArrayLayoutProps) {
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
    label: string
  }>(null)

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
            This is the default filter, so you can’t change its name or make it
            optional.
          </Text>
        </Infobox>
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
                      openDeleteModal(index)
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
        <DeleteCategoryOptionModal
          isOpen
          label={deleteTarget.label}
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
  const { errors, hasErrorAt } = useBuilderErrors()
  const [expandedOpen, setExpandedOpen] = useState(false)

  const duplicateOptionIndices = useMemo(() => {
    const items = get(core?.data, path) as { label?: string }[] | undefined
    return indicesWithDuplicateLabels(items)
  }, [core?.data, path])

  const hasDuplicateOptionNameError = hasUniqueItemPropertiesError({
    errors,
    jsonFormsPath: path,
  })

  const hasBlankOptionLabel = useMemo(() => {
    const items = get(core?.data, path) as { label?: string }[] | undefined
    return items?.some((item) => !(item?.label?.trim() ?? "")) ?? false
  }, [core?.data, path])

  const cannotLeaveExpandedCategoryOptions =
    hasBlankOptionLabel ||
    duplicateOptionIndices.size > 0 ||
    hasDuplicateOptionNameError ||
    hasErrorAt(path)

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
          <CategoryOptionsExpandedEditor {...props} />
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
        {hasDuplicateOptionNameError ? (
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
        ) : null}
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
              aria-invalid={
                duplicateOptionIndices.size > 0 || hasDuplicateOptionNameError
              }
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
              {(duplicateOptionIndices.size > 0 ||
                hasDuplicateOptionNameError) && (
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
                          ? "No option"
                          : `${data} ${data > 1 ? "options" : "option"}`}
                      </Text>
                      {(duplicateOptionIndices.size > 0 ||
                        hasDuplicateOptionNameError) && (
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

export const jsonFormsCategoryOptionsControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.CategoryOptionsControl,
  schemaMatches((schema) => schema.format === "category-options"),
)

export default withJsonFormsArrayLayoutProps(
  JsonFormsCategoryOptionsArrayLayoutInner,
)
