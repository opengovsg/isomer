import {
  Box,
  Center,
  FormControl,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftAddon,
  Stack,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import {
  Button,
  FormErrorMessage,
  FormLabel,
  Infobox,
  useToast,
} from "@opengovsg/design-system-react"
import { useState } from "react"
import { BiPlus, BiRightArrowAlt, BiSearch } from "react-icons/bi"
import { REDIRECT_MESSAGES } from "~/constants/redirect"
import {
  BRIEF_TOAST_SETTINGS,
  SETTINGS_TOAST_MESSAGES,
} from "~/constants/toast"
import { useZodForm } from "~/lib/form"

import { useCreateRedirect, useValidateRedirect } from "../api"
import { addRedirectSchema, type AddRedirectInput } from "../types"
import { SelectDestinationPageModal } from "./SelectDestinationPageModal"

interface AddRedirectCardProps {
  siteId: number
}

export const AddRedirectCard = ({
  siteId,
}: AddRedirectCardProps): JSX.Element => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    watch,
    getValues,
    setValue,
    formState: { errors },
  } = useZodForm<typeof addRedirectSchema>({
    schema: addRedirectSchema,
    defaultValues: { source: "", destination: "" },
  })
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const { mutate: createRedirect, isPending } = useCreateRedirect()
  const {
    isOpen: isPageModalOpen,
    onOpen: onPageModalOpen,
    onClose: onPageModalClose,
  } = useDisclosure()

  const [source, destination] = watch(["source", "destination"])
  const isAddDisabled = !source?.trim() || !destination?.trim()

  // The "Redirect to a page on your site..." dropdown only surfaces while the
  // destination field is focused (per the design).
  const [isDestinationFocused, setIsDestinationFocused] = useState(false)

  // Non-blocking warnings (e.g. the destination doesn't exist / isn't
  // published) are fetched on blur once the inputs are sync-valid.
  const [validateInput, setValidateInput] = useState<AddRedirectInput | null>(
    null,
  )
  const { warnings } = useValidateRedirect(siteId, validateInput)

  const checkForWarnings = () => {
    const parsed = addRedirectSchema.safeParse(getValues())
    setValidateInput(parsed.success ? parsed.data : null)
  }
  // Drop any shown warning the moment a field changes, so it never lingers
  // against edited input. (reset() doesn't fire onChange, so a successful add
  // clears it explicitly in onSuccess below.)
  const clearWarnings = () => setValidateInput(null)
  // On edit, also clear any server-set error on that field — otherwise an
  // inline "already redirected" / "loop" error (set via setError, which the
  // onSubmit-mode form doesn't revalidate) would linger over freshly-typed
  // input.
  const clearFieldFeedback = (field: keyof AddRedirectInput) => () => {
    clearWarnings()
    clearErrors(field)
  }

  const onSubmit = ({ source, destination }: AddRedirectInput) => {
    // source arrives normalised (leading slash, no trailing slash) by the
    // shared schema's transform. An internal-path destination is converted to a
    // page reference server-side, which 404s if the page doesn't exist.
    createRedirect(
      { siteId, source, destination },
      {
        onSuccess: () => {
          reset()
          clearWarnings()
          toast({ ...SETTINGS_TOAST_MESSAGES.success, status: "success" })
        },
        // The inputs are left untouched on error so the user can fix the
        // offending field. The schema covers the synchronous rules; these are
        // the DB-level checks the server re-enforces on create — surface them
        // inline on the relevant field rather than as a toast. redirect.create
        // only throws these codes; anything else is unexpected.
        onError: (error) => {
          switch (error.data?.code) {
            case "CONFLICT":
              setError("source", { message: REDIRECT_MESSAGES.alreadyExists })
              break
            case "PRECONDITION_FAILED":
              setError("source", {
                message: REDIRECT_MESSAGES.sourceIsExistingPage,
              })
              break
            case "UNPROCESSABLE_CONTENT":
              setError("destination", { message: REDIRECT_MESSAGES.loop })
              break
            default:
              toast({
                title: "Failed to add redirect",
                // Surface the server's message (e.g. validation rejections).
                // Client-side zod validation catches malformed input before
                // submit, so what reaches here is a clean TRPCError message.
                description: error.message,
                status: "error",
              })
          }
        },
      },
    )
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
        Redirects go live as soon as you add them.
      </Text>

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
              placeholder="redirect-from"
              {...register("source", {
                onBlur: checkForWarnings,
                onChange: clearFieldFeedback("source"),
              })}
            />
          </InputGroup>
          <FormErrorMessage>{errors.source?.message}</FormErrorMessage>
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
              onFocus={() => setIsDestinationFocused(true)}
              {...register("destination", {
                onBlur: () => {
                  setIsDestinationFocused(false)
                  checkForWarnings()
                },
                onChange: clearFieldFeedback("destination"),
              })}
            />

            {/* Dropdown opens the page picker. Preventing the default mousedown
                keeps the input focused so the click lands before blur removes
                this element. It's absolutely positioned below the input so
                showing it doesn't shift the surrounding layout. */}
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
                  onMouseDown={(e) => e.preventDefault()}
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

          {warnings.length > 0 && (
            <Stack spacing="0.5rem" mt="0.5rem">
              {warnings.map((warning) => (
                <Infobox key={warning.code} variant="warning" size="sm">
                  {warning.message}
                </Infobox>
              ))}
            </Stack>
          )}
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
        onSelect={(permalink) =>
          setValue("destination", permalink, {
            shouldValidate: true,
            shouldDirty: true,
          })
        }
      />
    </Box>
  )
}
