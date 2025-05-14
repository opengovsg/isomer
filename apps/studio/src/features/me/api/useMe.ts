import { useCallback, useMemo } from "react"
import { useRouter } from "next/router"
import { useGrowthBook } from "@growthbook/growthbook-react"

import { useLoginState } from "~/features/auth"
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
      return logoutMutation.mutate(undefined, {
        onSuccess: () => {
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

  return { me, logout, isOnboarded }
}
