import { Box, HStack, Stack, Text } from "@chakra-ui/react"
import { Spinner } from "@opengovsg/design-system-react"
import { useRouter } from "next/router"
import { useEffect, useRef } from "react"
import { IsomerLogo } from "~/components/Svg"
import { useLoginState } from "~/features/auth"
import { callbackUrlSchema } from "~/schemas/url"
import { trpc } from "~/utils/trpc"

import { oneGovSgFailurePath } from "../../oneGovSgRedirect"
import { useSignInContext } from "../SignInContext"

/** Shown for both a button click and an app-launcher login (`/sign-in?iss=`). */
export const OneGovSgLoginStep = (): JSX.Element => {
  const router = useRouter()
  const { backToInitial } = useSignInContext()
  const { setHasLoginStateFlag, removeLoginStateFlag } = useLoginState()
  const hasStarted = useRef(false)

  const { mutate } = trpc.auth.oneGovSg.login.useMutation({
    onSuccess: async ({ redirectUrl, isLoggedIn }) => {
      if (!isLoggedIn) {
        await router.push(redirectUrl)
        return
      }

      setHasLoginStateFlag()
      await router.replace(callbackUrlSchema.parse(redirectUrl))
    },
    onError: async (error) => {
      // A stale flag would make /sign-in redirect away before the error shows.
      removeLoginStateFlag()
      backToInitial()
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
