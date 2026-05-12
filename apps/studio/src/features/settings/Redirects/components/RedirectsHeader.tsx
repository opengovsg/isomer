import { Center, Flex, Icon, Stack, Text } from "@chakra-ui/react"
import { Button, Link, useToast } from "@opengovsg/design-system-react"
import { useEffect, useRef } from "react"
import { BiWrench } from "react-icons/bi"
import {
  BRIEF_TOAST_SETTINGS,
  SETTINGS_TOAST_MESSAGES,
} from "~/constants/toast"

import { useListRedirects, usePublishRedirects } from "../api"

interface RedirectsHeaderProps {
  siteId: number
}

export const RedirectsHeader = ({
  siteId,
}: RedirectsHeaderProps): JSX.Element => {
  const toast = useToast(BRIEF_TOAST_SETTINGS)
  const { data: redirects } = useListRedirects(siteId)
  const { mutate: publishRedirects, isPending } = usePublishRedirects()

  const hasDirtyRows = redirects.some((r) => r.hasUnpublishedChanges)

  const prevIsPending = useRef(false)
  useEffect(() => {
    if (prevIsPending.current && !isPending) {
      toast({
        ...SETTINGS_TOAST_MESSAGES.success,
        status: "success",
      })
    }
    prevIsPending.current = isPending
  }, [isPending, toast])

  return (
    <Flex justifyContent="space-between" align="center" w="full">
      <Stack spacing="0.5rem">
        <Flex align="center" gap="0.75rem">
          <Center
            w="2rem"
            h="2rem"
            bgColor="brand.secondary.100"
            borderRadius="6px"
          >
            <Icon as={BiWrench} boxSize="1rem" />
          </Center>
          <Text as="h1" textStyle="h3">
            Redirects
          </Text>
        </Flex>
        <Text textStyle="body-2" color="base.content.medium" maxW="44rem">
          When someone visits a link that is no longer in use, Redirects send
          them elsewhere so they don&apos;t get lost.
          <br />
          Learn{" "}
          <Link variant="inline" href="https://support.isomer.gov.sg">
            how to use redirects
          </Link>
          .
        </Text>
      </Stack>
      <Button
        isDisabled={!hasDirtyRows}
        isLoading={isPending}
        onClick={() => publishRedirects(siteId)}
        flexShrink={0}
        size="xs"
      >
        Publish
      </Button>
    </Flex>
  )
}
