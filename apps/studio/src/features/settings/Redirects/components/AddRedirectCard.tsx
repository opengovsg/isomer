import {
  Box,
  Center,
  FormControl,
  FormHelperText,
  HStack,
  Icon,
  Input,
  InputGroup,
  InputLeftAddon,
  Text,
  useDisclosure,
} from "@chakra-ui/react"
import {
  Button,
  FormErrorMessage,
  FormLabel,
  useToast,
} from "@opengovsg/design-system-react"
import { useState } from "react"
import { BiPlus, BiRightArrowAlt, BiSearch } from "react-icons/bi"
import { REDIRECT_MESSAGES } from "~/constants/redirect"
import {
  BRIEF_TOAST_SETTINGS,
  SETTINGS_TOAST_MESSAGES,
} from "~/constants/toast"
import { useIsAdvancedRedirectsEnabled } from "~/hooks/useIsAdvancedRedirectsEnabled"
import { useZodForm } from "~/lib/form"
import { normalizeRedirectSource, redirectKind } from "~/schemas/redirect"

import { useCreateRedirect } from "../api"
import { addRedirectSchema, type AddRedirectInput } from "../types"
import { SelectDestinationPageModal } from "./SelectDestinationPageModal"

const safeNormalize = (raw: string): string | null => {
  try {
    return normalizeRedirectSource(raw)
  } catch {
    return null
  }
}

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
  const isAdvancedEnabled = useIsAdvancedRedirectsEnabled()

  const [source, destination] = watch(["source", "destination"])
  const isAddDisabled = !source?.trim() || !destination?.trim()

  const normalizedSource = source?.trim() ? safeNormalize(source) : null
  const kind = normalizedSource ? redirectKind(normalizedSource) : "exact"

  // Live preview: show what /old/* + /dest produces → /old/foo → /dest/foo
  const wildcardPreview =
    isAdvancedEnabled && kind === "wildcard" && normalizedSource && destination
      ? (() => {
          const prefix = normalizedSource.slice(0, -2) // strip "/*"
          const destClean = destination.endsWith("/")
            ? destination.slice(0, -1)
            : destination
          return `${prefix}/example → ${destClean}/example`
        })()
      : null

  // The "Redirect to a page on your site..." dropdown only surfaces while the
  // destination field is focused (per the design).
  const [isDestinationFocused, setIsDestinationFocused] = useState(false)

  // On edit, clear any server-set error on that field — otherwise an inline
  // "already redirected" / "loop" error (set via setError, which the
  // onSubmit-mode form doesn't revalidate) would linger over freshly-typed
  // input.
  const clearFieldFeedback = (field: keyof AddRedirectInput) => () => {
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
        New redirects publish right away, but can take a few minutes to take
        effect on your live site.
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
              placeholder={
                isAdvancedEnabled ? "redirect-from or path/*" : "redirect-from"
              }
              {...register("source", {
                onChange: clearFieldFeedback("source"),
              })}
            />
          </InputGroup>
          <FormErrorMessage>{errors.source?.message}</FormErrorMessage>
          {isAdvancedEnabled && !errors.source && (
            <FormHelperText fontSize="xs" color="base.content.medium">
              {wildcardPreview
                ? `e.g. ${wildcardPreview}`
                : kind === "query"
                  ? "Query redirect: matches this exact URL including the query string."
                  : "Add /* at the end to redirect a whole section (e.g. /old-news/*)."}
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
              onFocus={() => setIsDestinationFocused(true)}
              {...register("destination", {
                onBlur: () => setIsDestinationFocused(false),
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
