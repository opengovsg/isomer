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
import { get } from "lodash"
import { useMemo, useState } from "react"
import {
  BiDotsHorizontalRounded,
  BiPurchaseTag,
  BiSolidErrorCircle,
  BiTrash,
} from "react-icons/bi"
import { MenuItem } from "~/components/Menu"
import { JSON_FORMS_RANKING } from "~/constants/formBuilder"

import { useBuilderErrors } from "../../ErrorProvider"
import { JsonFormsArrayControlView } from "./JsonFormsArrayControl"
import { hasUniqueItemPropertiesError } from "./utils/hasUniqueItemPropertiesError"
import { indicesWithDuplicateLabels } from "./utils/indicesWithDuplicateLabels"

function DeleteFilterModal({
  isOpen,
  label,
  onClose,
  onConfirm,
}: {
  isOpen: boolean
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
              <Text textStyle="body-1" color="base.content.strong">
                This removes the filter and its options from the collection.
                Collection items that use these options may need to be updated
                manually.
              </Text>
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
    label: string
  }>(null)

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
                    setDeleteTarget({
                      index,
                      label: page?.tagCategories?.[index]?.label?.trim() ?? "",
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
