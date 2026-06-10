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
} from "@opengovsg/design-system-react"
import { BiPlus, BiRightArrowAlt } from "react-icons/bi"
import { useZodForm } from "~/lib/form"

import { useCreateRedirect } from "../api"
import { addRedirectSchema, type AddRedirectInput } from "../types"

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
    formState: { errors },
  } = useZodForm<typeof addRedirectSchema>({
    schema: addRedirectSchema,
    defaultValues: { source: "", destination: "" },
  })
  const { mutate: createRedirect, isPending } = useCreateRedirect()

  const [source, destination] = watch(["source", "destination"])
  const isAddDisabled = !source?.trim() || !destination?.trim()

  const onSubmit = ({ source, destination }: AddRedirectInput) => {
    const normalisedSource = `/${source.replace(/^\/+/, "")}`
    createRedirect({ siteId, source: normalisedSource, destination })
    reset()
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
        New redirects need to be published to go live.
      </Text>

      <HStack
        as="form"
        spacing="0.75rem"
        align="flex-start"
        onSubmit={handleSubmit(onSubmit)}
      >
        <FormControl flex={1} isInvalid={!!errors.source} isRequired>
          <FormLabel>When someone visits</FormLabel>
          <InputGroup>
            <InputLeftAddon>/</InputLeftAddon>
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
              color="base.content.medium"
            />
          </Center>
        </Box>

        <FormControl flex={1} isInvalid={!!errors.destination} isRequired>
          <FormLabel>Redirect them to</FormLabel>
          <Input placeholder="/redirect-to" {...register("destination")} />
          <FormErrorMessage>{errors.destination?.message}</FormErrorMessage>
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
          >
            Add
          </Button>
        </Box>
      </HStack>
    </Box>
  )
}
