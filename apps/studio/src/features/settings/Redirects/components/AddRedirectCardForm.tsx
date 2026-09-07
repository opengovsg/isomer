/* oxlint-disable typescript/strict-void-return -- core cleanup deferred */
import type { UseFormReturn } from "react-hook-form"
import {
  Box,
  Center,
  Flex,
  FormControl,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftAddon,
  Text,
} from "@chakra-ui/react"
import {
  Button,
  FormErrorMessage,
  FormHelperText,
  FormLabel,
  Link,
} from "@opengovsg/design-system-react"
import posthogJs from "posthog-js"
import { BiBulb, BiPlus, BiRightArrowAlt, BiSearch } from "react-icons/bi"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"

import type { AddRedirectInput } from "../types"
import { WILDCARD_HINT } from "../constants"
import { BulkUploadRedirectsModal } from "./BulkUploadRedirectsModal"
import { SelectDestinationPageModal } from "./SelectDestinationPageModal"

interface AddRedirectCardFormUiState {
  isAddDisabled: boolean
  isDestinationFocused: boolean
  isPending: boolean
  isPageModalOpen: boolean
  isBulkUploadOpen: boolean
}

interface AddRedirectCardFormProps {
  siteId: number
  form: UseFormReturn<AddRedirectInput>
  uiState: AddRedirectCardFormUiState
  wildcardPreview: string | null
  setIsDestinationFocused: (focused: boolean) => void
  onPageModalOpen: () => void
  onPageModalClose: () => void
  onBulkUploadOpen: () => void
  onBulkUploadClose: () => void
  onSubmit: (values: AddRedirectInput) => void
}

export const AddRedirectCardForm = ({
  siteId,
  form,
  uiState,
  wildcardPreview,
  setIsDestinationFocused,
  onPageModalOpen,
  onPageModalClose,
  onBulkUploadOpen,
  onBulkUploadClose,
  onSubmit,
}: AddRedirectCardFormProps) => {
  const {
    isAddDisabled,
    isDestinationFocused,
    isPending,
    isPageModalOpen,
    isBulkUploadOpen,
  } = uiState
  const {
    register,
    handleSubmit,
    setValue,
    clearErrors,
    formState: { errors },
  } = form

  const clearFieldFeedback = (field: keyof AddRedirectInput) => () => {
    clearErrors(field)
  }

  return (
    <Box
      borderWidth="1px"
      borderRadius="0.5rem"
      p="1.25rem"
      pb="1.5rem"
      bgColor="base.canvas.default"
    >
      <Text textStyle="h6" mb="0.25rem" color="base.content.strong">
        Add new redirects
      </Text>
      <Text textStyle="body-2" color="base.content.medium" mb="1.25rem">
        New redirects publish right away, but can take a few minutes to take
        effect on your live site.
      </Text>

      <Flex
        align="center"
        gap="0.5rem"
        bg="utility.feedback.info-subtle"
        borderRadius="4px"
        p="0.75rem"
        mb="1.25rem"
      >
        <Icon
          as={BiBulb}
          boxSize="1.25rem"
          color="base.content.default"
          flexShrink={0}
        />
        <Text textStyle="subhead-2" color="base.content.default">
          Have more than 10 redirects to add? You can{" "}
          <Link
            as="button"
            type="button"
            variant="inline"
            textStyle="subhead-2"
            color="interaction.links.default"
            onClick={() => {
              posthogJs.capture("redirect_bulk_upload_modal_opened", {
                site_id: siteId,
              })
              onBulkUploadOpen()
            }}
          >
            bulk upload with a .csv instead
          </Link>
          .
        </Text>
      </Flex>
      <HStack as="form" align="flex-start" onSubmit={handleSubmit(onSubmit)}>
        <FormControl
          flex={1}
          maxW="24rem"
          isInvalid={!!errors.source}
          isRequired
        >
          <FormLabel size="sm">When someone visits</FormLabel>
          <InputGroup size="sm">
            <InputLeftAddon
              borderColor="base.divider.strong"
              bgColor="interaction.support.disabled"
            >
              /
            </InputLeftAddon>
            <Input
              placeholder="redirect-from or path/*"
              {...register("source", {
                onChange: clearFieldFeedback("source"),
              })}
            />
          </InputGroup>
          <FormErrorMessage>{errors.source?.message}</FormErrorMessage>
          {!errors.source && (
            <FormHelperText sx={{ mt: "0.75rem" }}>
              {hasNonEmptyString(wildcardPreview)
                ? `e.g. ${wildcardPreview}`
                : WILDCARD_HINT}
            </FormHelperText>
          )}
        </FormControl>

        <Box flexShrink={0}>
          <FormLabel size="sm" aria-hidden visibility="hidden">
            &nbsp;
          </FormLabel>
          <Center h="2.5rem">
            <Icon
              as={BiRightArrowAlt}
              boxSize="1.5rem"
              color="base.content.medium"
            />
          </Center>
        </Box>

        <FormControl
          flex={1}
          maxW="22rem"
          isInvalid={!!errors.destination}
          isRequired
        >
          <FormLabel size="sm">Redirect them to</FormLabel>
          <Box position="relative">
            <Input
              placeholder="/path-to-page or https://www.google.com"
              size="sm"
              onFocus={() => {
                setIsDestinationFocused(true)
              }}
              {...register("destination", {
                onBlur: () => {
                  setIsDestinationFocused(false)
                },
                onChange: clearFieldFeedback("destination"),
              })}
            />

            {isDestinationFocused && !errors.destination && (
              <Box
                position="absolute"
                top="100%"
                left={0}
                right={0}
                zIndex="dropdown"
                mt="0.25rem"
                py="0.5rem"
                bgColor="white"
                borderRadius="0.25rem"
                boxShadow="0px 0px 10px 0px rgba(191, 191, 191, 0.5)"
                overflow="hidden"
              >
                <HStack
                  as="button"
                  type="button"
                  w="full"
                  spacing="0.5rem"
                  px="0.75rem"
                  py="0.5rem"
                  onMouseDown={(e) => {
                    e.preventDefault()
                  }}
                  onClick={onPageModalOpen}
                  _hover={{ bgColor: "interaction.muted.main.hover" }}
                >
                  <Icon
                    as={BiSearch}
                    boxSize="1rem"
                    color="interaction.main.default"
                  />
                  <Text textStyle="body-2" color="interaction.main.default">
                    Redirect to a page on your site
                  </Text>
                </HStack>
              </Box>
            )}
          </Box>
          <FormErrorMessage>{errors.destination?.message}</FormErrorMessage>
        </FormControl>

        <Box flexShrink={0} ml="0.5rem">
          <FormLabel size="sm" aria-hidden visibility="hidden">
            &nbsp;
          </FormLabel>
          <Button
            type="submit"
            isDisabled={isAddDisabled}
            isLoading={isPending}
            leftIcon={<Icon as={BiPlus} />}
            size="sm"
          >
            Add
          </Button>
        </Box>
      </HStack>

      <SelectDestinationPageModal
        isOpen={isPageModalOpen}
        siteId={siteId}
        onClose={onPageModalClose}
        onSelect={(permalink) => {
          setValue("destination", permalink, {
            shouldDirty: true,
            shouldValidate: true,
          })
        }}
      />

      <BulkUploadRedirectsModal
        siteId={siteId}
        isOpen={isBulkUploadOpen}
        onClose={onBulkUploadClose}
      />
    </Box>
  )
}
