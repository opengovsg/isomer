import { useRouter } from "next/router"

import { FullscreenSpinner } from "~/components/FullscreenSpinner"
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

  trpc.auth.singpass.callback.useSuspenseQuery(
    { code: String(code), state: String(state) },
    {
      staleTime: Infinity,
      onSuccess: ({ redirectUrl }) => {
        setHasLoginStateFlag()
        void utils.me.get.invalidate()
        void router.replace(callbackUrlSchema.parse(redirectUrl))
      },
      onError: (error) => {
        console.error(error)
        void router.replace(`${SIGN_IN}?error=${error.message}`)
      },
    },
  )

  return <FullscreenSpinner />
}
