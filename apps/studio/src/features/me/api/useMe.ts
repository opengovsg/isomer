import { useGrowthBook } from "@growthbook/growthbook-react"
import { useRouter } from "next/router"
import posthogJs from "posthog-js"
import { useCallback, useMemo } from "react"
import { useLoginState } from "~/features/auth"
import { withPosthog } from "~/lib/posthog"
import { trpc } from "~/utils/trpc"

import { isUserOnboarded } from "./isUserOnboarded"

export const useMe = () => {
  const [me] = trpc.me.get.useSuspenseQuery()
  const router = useRouter()
  const gb = useGrowthBook()

  const { removeLoginStateFlag } = useLoginState()
  const logoutMutation = trpc.auth.logout.useMutation()

  const logout = useCallback(
    (redirectToSignIn = true) => {
      logoutMutation.mutate(undefined, {
        onSuccess: () => {
          posthogJs.capture("user_logged_out")
          // oxlint-disable-next-line eslint/no-shadow -- core cleanup deferred
          void withPosthog((posthog) => {
            posthogJs.reset()
          })
          void gb.setAttributes({})
          removeLoginStateFlag()
          if (redirectToSignIn) {
            void router.push("/sign-in")
          }
        },
      })
    },
    [gb, logoutMutation, removeLoginStateFlag, router],
  )

  const isOnboarded = useMemo(() => isUserOnboarded(me), [me])

  return { isOnboarded, logout, me }
}
