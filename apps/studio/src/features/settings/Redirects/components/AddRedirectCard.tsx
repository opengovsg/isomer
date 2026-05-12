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
import { useState } from "react"
import { BiPlus, BiRightArrowAlt } from "react-icons/bi"

import { useCreateRedirect } from "../api"
import { addRedirectSchema } from "../types"

interface AddRedirectCardProps {
  siteId: number
}

export const AddRedirectCard = ({
  siteId,
}: AddRedirectCardProps): JSX.Element => {
  const [source, setSource] = useState("")
  const [destination, setDestination] = useState("")
  const [sourceError, setSourceError] = useState("")
  const [destinationError, setDestinationError] = useState("")
  const { mutate: createRedirect, isPending } = useCreateRedirect()

  const validate = () => {
    const result = addRedirectSchema.safeParse({ source, destination })
    if (result.success) {
      setSourceError("")
      setDestinationError("")
      return true
    }
    const fieldErrors = result.error.flatten().fieldErrors
    setSourceError(fieldErrors.source?.[0] ?? "")
    setDestinationError(fieldErrors.destination?.[0] ?? "")
    return false
  }

  const isAddDisabled = !source.trim() || !destination.trim()

  const handleAdd = () => {
    if (isAddDisabled) return
    if (!validate()) return
    const normalisedSource = `/${source.replace(/^\/+/, "")}`
    createRedirect({ siteId, source: normalisedSource, destination })
    setSource("")
    setDestination("")
    setSourceError("")
    setDestinationError("")
  }

  const handleSubmit = (e: React.FormEvent<HTMLDivElement>) => {
    e.preventDefault()
    handleAdd()
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
        onSubmit={handleSubmit}
      >
        <FormControl flex={1} isInvalid={!!sourceError} isRequired>
          <FormLabel>When someone visits</FormLabel>
          <InputGroup>
            <InputLeftAddon>/</InputLeftAddon>
            <Input
              placeholder="redirect-from"
              value={source}
              onChange={(e) => setSource(e.target.value)}
              onBlur={validate}
            />
          </InputGroup>
          <FormErrorMessage>{sourceError}</FormErrorMessage>
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

        <FormControl flex={1} isInvalid={!!destinationError} isRequired>
          <FormLabel>Redirect them to</FormLabel>
          <Input
            placeholder="/redirect-to"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onBlur={validate}
          />
          <FormErrorMessage>{destinationError}</FormErrorMessage>
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
