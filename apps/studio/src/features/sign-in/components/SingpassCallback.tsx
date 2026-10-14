import { Button, Flex, Grid, GridItem, Text } from "@chakra-ui/react"
import { RestrictedGovtMasthead } from "@opengovsg/design-system-react"
import NextLink from "next/link"
import { useRouter } from "next/router"
import posthog from "posthog-js"
import { useEffect } from "react"
import { FullscreenSpinner } from "~/components/FullscreenSpinner"
import { IsomerLogo } from "~/components/Svg"
import { useLoginState } from "~/features/auth"
import { SIGN_IN_SINGPASS } from "~/lib/routes"
import { callbackUrlSchema } from "~/schemas/url"
import { trpc } from "~/utils/trpc"

import { singpassCallbackFailurePath } from "../singpassRedirect"

const queryValue = (
  value: string | string[] | undefined,
): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined

const RedirectToSingpassSignIn = ({
  singpassError,
}: {
  singpassError: string | undefined
}): JSX.Element => {
  const router = useRouter()

  useEffect(() => {
    void router.replace(singpassCallbackFailurePath(singpassError))
  }, [router, singpassError])

  return <FullscreenSpinner />
}

const CompleteSingpassLogin = ({
  code,
  state,
  iss,
}: {
  code: string
  state: string
  iss?: string
}): JSX.Element => {
  const { setHasLoginStateFlag } = useLoginState()

  const router = useRouter()
  const utils = trpc.useUtils()

  const [data, dataQuery] = trpc.auth.singpass.callback.useSuspenseQuery(
    {
      code,
      state,
      iss,
    },
    {
      staleTime: Infinity,
    },
  )

  const { isNewUser, redirectUrl } = data

  useEffect(() => {
    if (!dataQuery.isSuccess) {
      return
    }

    setHasLoginStateFlag()
    void utils.me.get.invalidate()

    if (!isNewUser) {
      posthog.capture("user_logged_in", { method: "singpass" })
      void router.replace(callbackUrlSchema.parse(redirectUrl))
    }
  }, [
    dataQuery.isSuccess,
    isNewUser,
    redirectUrl,
    router,
    setHasLoginStateFlag,
    utils.me.get,
  ])

  useEffect(() => {
    if (!dataQuery.isError) {
      return
    }

    void router.replace(`${SIGN_IN_SINGPASS}?error=true`)
  }, [dataQuery.isError, router])

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

/**
 * This component is responsible for handling the callback from the Singpass
 * login.
 */
export const SingpassCallback = (): JSX.Element => {
  const router = useRouter()

  if (!router.isReady) {
    return <FullscreenSpinner />
  }

  const code = queryValue(router.query.code)
  const state = queryValue(router.query.state)
  const iss = queryValue(router.query.iss)
  const singpassError = queryValue(router.query.error)

  // A failed Singpass redirect has `error` and no authorization code. Do not
  // send a stand-in code to the token exchange.
  if (singpassError || !code || !state) {
    return <RedirectToSingpassSignIn singpassError={singpassError} />
  }

  return <CompleteSingpassLogin code={code} state={state} iss={iss} />
}
