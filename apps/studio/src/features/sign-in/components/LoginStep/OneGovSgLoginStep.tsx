import { Box, HStack, Stack, Text } from "@chakra-ui/react"
import { Spinner } from "@opengovsg/design-system-react"
import { useRouter } from "next/router"
import { useEffect, useRef } from "react"
import { IsomerLogo } from "~/components/Svg"
import { useLoginState } from "~/features/auth"
import { SIGN_IN } from "~/lib/routes"
import { callbackUrlSchema } from "~/schemas/url"
import { trpc } from "~/utils/trpc"

import { oneGovSgErrorState, oneGovSgFailurePath } from "../../oneGovSgRedirect"
import { useSignInContext } from "../SignInContext"

/** Shown for both a button click and an app-launcher login (`/sign-in?iss=`). */
export const OneGovSgLoginStep = (): JSX.Element => {
  const router = useRouter()
  const { backToInitial, setErrorState } = useSignInContext()
  const { setHasLoginStateFlag, removeLoginStateFlag } = useLoginState()
  const hasStarted = useRef(false)

  const { mutate } = trpc.auth.oneGovSg.login.useMutation({
    onSuccess: async ({ redirectUrl, isLoggedIn }) => {
      if (!isLoggedIn) {
        // The server has just cleared the Studio session; a flag left behind
        // would make /sign-in redirect away if this login is abandoned.
        removeLoginStateFlag()
        await router.push(redirectUrl)
        return
      }

      setHasLoginStateFlag()
      await router.replace(callbackUrlSchema.parse(redirectUrl))
    },
    onError: async (error) => {
      backToInitial()

      // one.gov.sg isn't configured here: drop `iss` and carry on as a normal
      // sign-in, so a logged-in user still reaches the dashboard.
      if (error.data?.code === "NOT_FOUND") {
        await router.replace(SIGN_IN)
        return
      }

      // A stale flag would make /sign-in redirect away before the error shows.
      removeLoginStateFlag()
      // Set directly: a repeat failure lands on the same URL, which doesn't
      // re-trigger the provider's URL effect.
      setErrorState(oneGovSgErrorState(error.data?.code))
      await router.replace(oneGovSgFailurePath(error.data?.code))
    },
  })

  const iss =
    typeof router.query.iss === "string" ? router.query.iss : undefined

  useEffect(() => {
    // A second start would overwrite the first transaction, so a strict-mode
    // double effect must not fire twice.
    if (hasStarted.current) {
      return
    }
    hasStarted.current = true
    mutate({ iss })
  }, [iss, mutate])

  return (
    <Stack gap="1.5rem" w="100%">
      <Box>
        <IsomerLogo />
      </Box>

      <HStack spacing="0.75rem">
        <Spinner color="interaction.main.default" fontSize="1.5rem" />
        <Text color="base.content.strong" textStyle="subhead-1">
          Logging in with one.gov.sg
        </Text>
      </HStack>
    </Stack>
  )
}
