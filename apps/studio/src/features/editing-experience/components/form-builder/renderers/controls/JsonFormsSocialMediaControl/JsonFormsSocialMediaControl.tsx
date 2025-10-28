import type {
  ArrayLayoutProps,
  JsonFormsCellRendererRegistryEntry,
  JsonFormsRendererRegistryEntry,
  JsonSchema,
  RankedTester,
  UISchemaElement,
} from "@jsonforms/core"
import { useCallback, useEffect, useState } from "react"
import {
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Icon,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Tooltip,
  VStack,
} from "@chakra-ui/react"
import {
  composePaths,
  computeChildLabel,
  createDefaultValue,
  findUISchema,
  rankWith,
  schemaMatches,
} from "@jsonforms/core"
import {
  JsonFormsDispatch,
  useJsonForms,
  withJsonFormsArrayLayoutProps,
} from "@jsonforms/react"
import {
  BiLeftArrowAlt,
  BiPlusCircle,
  BiSitemap,
  BiTrash,
} from "react-icons/bi"

import { JSON_FORMS_RANKING } from "~/constants/formBuilder"
import { FORM_BUILDER_PARENT_ID } from "../../../constants"
import { useBuilderErrors } from "../../../ErrorProvider"
import { SOCIAL_MEDIA_LINKS } from "./constants"
import { SocialMediaLink } from "./SocialMediaLink"

export const jsonFormsSocialMediaControlTester: RankedTester = rankWith(
  JSON_FORMS_RANKING.SocialMediaControl,
  schemaMatches((schema) => schema.format === "socialMedia"),
)

interface EditSocialMediaLinkItemProps {
  renderers?: JsonFormsRendererRegistryEntry[]
  cells?: JsonFormsCellRendererRegistryEntry[]
  visible: boolean
  schema: JsonSchema
  uischema: UISchemaElement
  path: string
  onBack: () => void
  handleRemoveItem: () => void
}

const EditSocialMediaLinkItem = ({
  renderers,
  cells,
  visible,
  schema,
  uischema,
  path,
  onBack,
  handleRemoveItem,
}: EditSocialMediaLinkItemProps) => {
  const ctx = useJsonForms()
  const value = computeChildLabel(
    ctx.core?.data,
    path,
    "",
    schema,
    ctx.core?.schema ?? {},
    ctx.i18n?.translate ?? ((s) => s),
    uischema,
  )
  const label = SOCIAL_MEDIA_LINKS.find((link) => link.type === value)?.label

  // Disable scrolling on parent container when editing a link item, as this
  // is an absolutely-positioned overlay
  useEffect(() => {
    const parent = document.getElementById(FORM_BUILDER_PARENT_ID)
    if (parent) {
      parent.scrollTop = 0
      parent.style.overflow = "hidden"
    }

    return () => {
      if (parent) {
        parent.style.overflow = "auto"
      }
    }
  }, [])

  return (
    <VStack
      position="absolute"
      top={0}
      left={0}
      w="full"
      h="100%"
      zIndex={1}
      bg="grey.50"
      alignItems="start"
      gap={0}
    >
      {/* Header section */}
      <VStack
        px="1.5rem"
        pt="2rem"
        pb="1.5rem"
        gap="1.25rem"
        alignItems="start"
        w="full"
      >
        <Button
          variant="link"
          leftIcon={<BiLeftArrowAlt fontSize="1.25rem" />}
          onClick={onBack}
          textStyle="subhead-2"
        >
          Back to footer
        </Button>

        <HStack gap="0.75rem" w="full" alignItems="center">
          <Box
            aria-hidden
            bg="brand.secondary.100"
            borderRadius="0.375rem"
            p="0.5rem"
            lineHeight="1rem"
          >
            <Icon as={BiSitemap} fontSize="1rem" />
          </Box>

          <Text
            as="h2"
            textStyle="h3"
            textColor="base.content.default"
            textOverflow="ellipsis"
          >
            {label || "Add a social media link"}
          </Text>
        </HStack>
      </VStack>

      <Box w="full">
        <Box w="full" h="full" px="1.5rem" overflow="auto">
          <JsonFormsDispatch
            renderers={renderers}
            cells={cells}
            visible={visible}
            schema={schema}
            uischema={uischema}
            path={path}
          />
        </Box>

        <HStack w="full" justifyContent="center" mt="-1.125rem" mb="1.5rem">
          <Button
            variant="clear"
            colorScheme="critical"
            size="xs"
            leftIcon={<Icon as={BiTrash} />}
            onClick={handleRemoveItem}
          >
            Delete this link
          </Button>
        </HStack>
      </Box>
    </VStack>
  )
}

interface DeleteSocialMediaLinkModalProps {
  isOpen: boolean
  onClose: () => void
  onDelete: () => void
  path: string
  schema: JsonSchema
  uischema: UISchemaElement
}

const DeleteSocialMediaLinkModal = ({
  isOpen,
  onClose,
  onDelete,
  path,
  schema,
  uischema,
}: DeleteSocialMediaLinkModalProps) => {
  const ctx = useJsonForms()
  const value = computeChildLabel(
    ctx.core?.data,
    path,
    "",
    schema,
    ctx.core?.schema ?? {},
    ctx.i18n?.translate ?? ((s) => s),
    uischema,
  )
  const label = SOCIAL_MEDIA_LINKS.find((link) => link.type === value)?.label

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />

      <ModalContent>
        <ModalHeader mr="3.5rem">Delete {label} link?</ModalHeader>

        <ModalCloseButton size="lg" />

        <ModalBody>
          <Text textStyle="body-1">
            You’re about to delete 1 social media link from the footer.
          </Text>
        </ModalBody>

        <ModalFooter>
          <HStack spacing="1rem">
            <Button variant="clear" colorScheme="neutral" onClick={onClose}>
              No, don’t delete
            </Button>
            <Button variant="solid" colorScheme="critical" onClick={onDelete}>
              Delete link
            </Button>
          </HStack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}

export const JsonFormsSocialMediaControl = ({
  data,
  path,
  visible,
  label,
  addItem,
  removeItems,
  arraySchema,
  schema,
  rootSchema,
  renderers,
  cells,
  uischemas,
  uischema,
  description,
}: ArrayLayoutProps) => {
  const { hasErrorAt } = useBuilderErrors()
  const [selectedIndex, setSelectedIndex] = useState<number>()
  const [selectedPathForDeletion, setSelectedPathForDeletion] =
    useState<string>()

  const handleRemoveItem = useCallback(
    (path: string, index: number) => () => {
      if (!removeItems) {
        return
      }

      removeItems(path, [index])()

      if (!selectedIndex) {
        return
      } else if (selectedIndex === index) {
        setSelectedIndex(undefined)
      } else if (selectedIndex > index) {
        setSelectedIndex(selectedIndex - 1)
      }
    },
    [removeItems, selectedIndex],
  )

  const handleDeleteItem = () => {
    if (selectedPathForDeletion === undefined) {
      return
    }

    const index = Number(selectedPathForDeletion.split(".").pop())
    handleRemoveItem(path, index)()
    setSelectedPathForDeletion(undefined)
    setSelectedIndex(undefined)
  }

  const getChildUiSchema = useCallback(
    (subpath: string) =>
      findUISchema(
        uischemas ?? [],
        schema,
        uischema.scope,
        subpath,
        undefined,
        uischema,
        rootSchema,
      ),
    [uischemas, schema, uischema, rootSchema],
  )

  if (selectedIndex !== undefined) {
    return (
      <>
        <DeleteSocialMediaLinkModal
          isOpen={!!selectedPathForDeletion}
          onClose={() => setSelectedPathForDeletion(undefined)}
          onDelete={handleDeleteItem}
          path={selectedPathForDeletion ?? ""}
          schema={schema}
          uischema={getChildUiSchema(selectedPathForDeletion ?? "")}
        />

        <EditSocialMediaLinkItem
          renderers={renderers}
          cells={cells}
          visible={visible}
          schema={schema}
          uischema={getChildUiSchema(composePaths(path, `${selectedIndex}`))}
          path={composePaths(path, `${selectedIndex}`)}
          handleRemoveItem={() =>
            setSelectedPathForDeletion(composePaths(path, `${selectedIndex}`))
          }
          onBack={() => setSelectedIndex(undefined)}
        />
      </>
    )
  }

  return (
    <>
      <DeleteSocialMediaLinkModal
        isOpen={!!selectedPathForDeletion}
        onClose={() => setSelectedPathForDeletion(undefined)}
        onDelete={handleDeleteItem}
        path={selectedPathForDeletion ?? ""}
        schema={schema}
        uischema={getChildUiSchema(selectedPathForDeletion ?? "")}
      />

      <Divider />
      <VStack spacing="0.375rem" align="start">
        <VStack justify="space-between" align="start" w="full">
          <HStack w="full" justifyContent="space-between">
            <VStack align="start" spacing="0.25rem">
              <Text textStyle="subhead-1">{label}</Text>

              {description && (
                <Text textStyle="body-2" textColor="base.content.default">
                  {description}
                </Text>
              )}
            </VStack>

            <Tooltip
              label={
                arraySchema.maxItems && data >= arraySchema.maxItems
                  ? `You can only place up to ${arraySchema.maxItems} links.`
                  : undefined
              }
              hasArrow
            >
              <Button
                variant="clear"
                size="xs"
                leftIcon={<Icon as={BiPlusCircle} />}
                onClick={addItem(path, createDefaultValue(schema, rootSchema))}
                isDisabled={
                  arraySchema.maxItems ? data >= arraySchema.maxItems : false
                }
              >
                Add a link
              </Button>
            </Tooltip>
          </HStack>
        </VStack>
        <VStack align="baseline" w="100%" h="100%" spacing={0} mt="-0.25rem">
          {data === 0 ? (
            <Flex
              alignItems="center"
              flexDir="column"
              px="1.5rem"
              p="3.75rem"
              mt="0.25rem"
              justifyContent="center"
              w="100%"
            >
              <Text
                textStyle="subhead-1"
                textColor="base.content.default"
                textAlign="center"
              >
                Items you add will appear here
              </Text>
            </Flex>
          ) : (
            <VStack gap="0.5rem" mt="1rem" w="full">
              {[...Array(data).keys()].map((index) => {
                const childPath = composePaths(path, `${index}`)
                const hasError = hasErrorAt(childPath)

                return (
                  <SocialMediaLink
                    path={childPath}
                    isInvalid={hasError}
                    onDelete={() => setSelectedPathForDeletion(childPath)}
                    onEdit={() => setSelectedIndex(index)}
                  />
                )
              })}
            </VStack>
          )}
        </VStack>
      </VStack>
    </>
  )
}

export default withJsonFormsArrayLayoutProps(JsonFormsSocialMediaControl)
