import { useRouter } from "next/router"
import { Box, Flex, Stack, Text } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"

import { SingpassFullLogo } from "~/components/Svg/SingpassFullLogo"
import { trpc } from "~/utils/trpc"
import { getRedirectUrl } from "~/utils/url"

export const SingpassLoginButton = (): JSX.Element | null => {
  const router = useRouter()
  const singpassLoginMutation = trpc.auth.singpass.login.useMutation({
    onSuccess: async ({ redirectUrl }) => {
      await router.push(redirectUrl)
    },
  })

  const landingUrl = getRedirectUrl(router.query)

  const handleSingpassLogin = () => {
    return singpassLoginMutation.mutate({
      landingUrl,
    })
  }

  return (
    <Stack gap="0.75rem">
      <Button
        colorScheme="neutral"
        height="2.75rem"
        size="xs"
        variant="outline"
        isLoading={singpassLoginMutation.isLoading}
        onClick={handleSingpassLogin}
        aria-label="Authenticate with Singpass"
      >
        <Flex align="center" flexDirection="row" aria-hidden>
          <Text>Authenticate with </Text>
          {/* Negative margin so the svg sits on the same line as the text */}
          <Box mb="-3px">
            <SingpassFullLogo height="1rem" />
          </Box>
        </Flex>
      </Button>
    </Stack>
  )
}
