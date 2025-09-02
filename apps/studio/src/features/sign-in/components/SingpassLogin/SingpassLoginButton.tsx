import { useRouter } from "next/router"
import { Box, Flex, Text } from "@chakra-ui/react"
import { Button } from "@opengovsg/design-system-react"

import { SingpassFullLogo } from "~/components/Svg/SingpassFullLogo"
import { SIGN_IN } from "~/lib/routes"
import { trpc } from "~/utils/trpc"
import { getRedirectUrl } from "~/utils/url"

export const SingpassLoginButton = (): JSX.Element | null => {
  const router = useRouter()
  const singpassLoginMutation = trpc.auth.singpass.login.useMutation({
    onSuccess: async ({ redirectUrl }) => {
      await router.push(redirectUrl)
    },
    onError: async (error) => {
      await router.push(`${SIGN_IN}?error=${error.message}`)
    },
  })

  const landingUrl = getRedirectUrl(router.query)

  const handleSingpassLogin = () => {
    return singpassLoginMutation.mutate({
      landingUrl,
    })
  }

  return (
    <Button
      height="2.75rem"
      width="full"
      size="sm"
      variant="outline"
      colorScheme="clear"
      bgColor="#F4333D"
      _disabled={{ bgColor: "#F4333D" }}
      _hover={{ bgColor: "#B0262D" }}
      textColor="white"
      isLoading={singpassLoginMutation.isPending}
      onClick={handleSingpassLogin}
      aria-label="Authenticate with Singpass"
    >
      <Flex align="center" flexDirection="row" flexWrap="wrap" aria-hidden>
        <Text fontWeight="700">Authenticate with </Text>
        {/* Negative margin so the svg sits on the same line as the text */}
        <Box mb="-3px">
          <SingpassFullLogo height="1rem" />
        </Box>
      </Flex>
    </Button>
  )
}
