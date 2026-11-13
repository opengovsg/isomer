import { Divider, HStack, Stack, Text } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"
import { trpc } from "~/utils/trpc"

import { useSignInContext } from "../SignInContext"

export const OneGovSgLoginButton = (): JSX.Element | null => {
  const { proceedToOneGovSg } = useSignInContext()
  const { data: isEnabled } = trpc.auth.oneGovSg.isEnabled.useQuery()

  // Optional login method: stays hidden while loading, on error, or when off.
  if (!isEnabled) {
    return null
  }

  return (
    <Stack spacing="1.5rem">
      <HStack spacing="0.75rem">
        <Divider />
        <Text textStyle="caption-1" color="base.content.medium">
          OR
        </Text>
        <Divider />
      </HStack>

      {/* Exact label required by the one.gov.sg integration guide. */}
      <Button
        size="sm"
        height="2.75rem"
        variant="outline"
        onClick={proceedToOneGovSg}
      >
        Login with one.gov.sg
      </Button>
    </Stack>
  )
}
