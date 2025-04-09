import NextLink from "next/link"
import { useRouter } from "next/router"
import { Button, Flex, Grid, GridItem, Text } from "@chakra-ui/react"
import { RestrictedGovtMasthead } from "@opengovsg/design-system-react"

import { FullscreenSpinner } from "~/components/FullscreenSpinner"
import { IsomerLogo } from "~/components/Svg"
import { useLoginState } from "~/features/auth"
import { SIGN_IN } from "~/lib/routes"
import { callbackUrlSchema } from "~/schemas/url"
import { trpc } from "~/utils/trpc"

/**
 * This component is responsible for handling the callback from the Singpass
 * login.
 */
export const SingpassCallback = (): JSX.Element => {
  const { setHasLoginStateFlag } = useLoginState()

  const router = useRouter()
  const utils = trpc.useUtils()

  const {
    query: { code, state },
  } = router

  const [data] = trpc.auth.singpass.callback.useSuspenseQuery(
    { code: String(code), state: String(state) },
    {
      staleTime: Infinity,
      onSuccess: ({ isNewUser, redirectUrl }) => {
        setHasLoginStateFlag()
        void utils.me.get.invalidate()

        if (!isNewUser) {
          void router.replace(callbackUrlSchema.parse(redirectUrl))
        }
      },
      onError: (error) => {
        console.error(error)
        void router.replace(`${SIGN_IN}?error=${error.message}`)
      },
    },
  )

  const { isNewUser, redirectUrl } = data

  if (!isNewUser) {
    return <FullscreenSpinner />
  }

  return (
    <Flex w="100%" flexDir="column" minH="$100vh">
      <RestrictedGovtMasthead />

      <Grid
        templateColumns="repeat(12, 1fr)"
        gap="0"
        h="100%"
        w="100%"
        placeItems="center"
        bgColor="base.canvas.alt"
      >
        <GridItem
          bgColor="white"
          gridColumnStart={5}
          gridColumn="5 / 9"
          borderRadius="md"
          border="1px solid"
          borderColor="base.divider.medium"
          px="1.75rem"
          py="2rem"
          minW="19.5rem"
        >
          <Flex w="100%" flexDir="column" alignItems="start" gap="1.75rem">
            <IsomerLogo />

            <Flex w="100%" flexDir="column" gap="0.75rem">
              <Text textStyle="subhead-1" color="base.content.default">
                All done. You’ve set up Singpass as your 2FA method.
              </Text>

              <Text textStyle="body-2" color="base.content.default">
                From now on, you’ll need to use your email and Singpass to log
                in to Isomer Studio.
              </Text>
            </Flex>

            <Button as={NextLink} href={redirectUrl} w="full">
              Continue to Isomer Studio
            </Button>
          </Flex>
        </GridItem>
      </Grid>
    </Flex>
  )
}
