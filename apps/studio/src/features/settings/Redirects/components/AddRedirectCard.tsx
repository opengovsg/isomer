import {
  Box,
  Center,
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
  FormLabel,
  Link,
  useToast,
} from "@opengovsg/design-system-react"
import { useState } from "react"
import { BiLinkAlt, BiPlus, BiRightArrowAlt } from "react-icons/bi"
import {
  BRIEF_TOAST_SETTINGS,
  SETTINGS_TOAST_MESSAGES,
} from "~/constants/toast"
import { useZodForm } from "~/lib/form"

import { useCreateRedirect } from "../api"
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
    watch,
    setValue,
    formState: { errors },
  } = useZodForm<typeof addRedirectSchema>({
    schema: addRedirectSchema,
    defaultValues: { source: "", destination: "" },
  })
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const { mutate: createRedirect, isPending } = useCreateRedirect()
  const [isPageModalOpen, setIsPageModalOpen] = useState(false)

  const [source, destination] = watch(["source", "destination"])
  const isAddDisabled = !source?.trim() || !destination?.trim()

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
        // The inputs are left untouched on error so the user can adjust
        // the source instead of retyping everything
        onError: (error) => {
          switch (error.data?.code) {
            case "CONFLICT":
              toast({
                title: "A redirect already exists for this path",
                description: `Delete the redirect for ${source} first if you want to change where it points to.`,
                status: "error",
              })
              break
            case "NOT_FOUND":
              toast({
                title: "That page doesn't exist",
                description:
                  "Check the destination, or pick a page with “Link to a page”.",
                status: "error",
              })
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
      bgColor="base.canvas.default"
    >
      <Text textStyle="subhead-1" mb="0.25rem">
        Add new redirects
      </Text>
      <Text textStyle="body-2" color="base.content.medium" mb="1.25rem">
        Redirects go live as soon as you add them.
      </Text>

      <HStack
        as="form"
        spacing="0.75rem"
        align="flex-start"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormControl flex={1} isInvalid={!!errors.source} isRequired>
          <FormLabel>When someone visits</FormLabel>
          <InputGroup size="xs">
            <InputLeftAddon
              borderColor="base.divider.strong"
              bgColor="interaction.support.disabled"
            >
              /
            </InputLeftAddon>
            <Input placeholder="redirect-from" {...register("source")} />
          </InputGroup>
          <FormErrorMessage>{errors.source?.message}</FormErrorMessage>
        </FormControl>

        <Box flexShrink={0}>
          <FormLabel aria-hidden visibility="hidden">
            &nbsp;
          </FormLabel>
          <Center h="2.5rem">
            <Icon
              as={BiRightArrowAlt}
              boxSize="1.5rem"
              color="standard.black"
            />
          </Center>
        </Box>

        <FormControl flex={1} isInvalid={!!errors.destination} isRequired>
          <FormLabel>Redirect them to</FormLabel>
          <Input
            placeholder="/redirect-to"
            size="xs"
            {...register("destination")}
          />
          <FormErrorMessage>{errors.destination?.message}</FormErrorMessage>
          <Link
            as="button"
            type="button"
            variant="standalone"
            p="0"
            mt="0.25rem"
            onClick={() => setIsPageModalOpen(true)}
          >
            <Icon as={BiLinkAlt} mr="0.25rem" />
            Link to a page
          </Link>
        </FormControl>

        <Box flexShrink={0}>
          <FormLabel aria-hidden visibility="hidden">
            &nbsp;
          </FormLabel>
          <Button
            type="submit"
            isDisabled={isAddDisabled}
            isLoading={isPending}
            leftIcon={<Icon as={BiPlus} />}
            size="xs"
          >
            Add
          </Button>
        </Box>
      </HStack>

      <SelectDestinationPageModal
        isOpen={isPageModalOpen}
        siteId={siteId}
        onClose={() => setIsPageModalOpen(false)}
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
