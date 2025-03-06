import { useCallback, useMemo } from "react"
import Router from "next/router"

import { useLoginState } from "~/features/auth"
import { trpc } from "~/utils/trpc"
import { isUserOnboarded } from "./isUserOnboarded"

export const useMe = () => {
  const [me] = trpc.me.get.useSuspenseQuery()

  const { removeLoginStateFlag } = useLoginState()
  const logoutMutation = trpc.auth.logout.useMutation()

  const logout = useCallback(
    (redirectToSignIn = true) => {
      return logoutMutation.mutate(undefined, {
        onSuccess: () => {
          removeLoginStateFlag()
          if (redirectToSignIn) {
            void Router.push("/sign-in")
          }
        },
      })
    },
    [logoutMutation, removeLoginStateFlag],
  )

  const isOnboarded = useMemo(() => isUserOnboarded(me), [me])

  return { me, logout, isOnboarded }
}
