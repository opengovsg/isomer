import { useRouter } from "next/router"
import posthog from "posthog-js"
import { useEffect } from "react"
import { FullscreenSpinner } from "~/components/FullscreenSpinner"
import { useLoginState } from "~/features/auth"
import { callbackUrlSchema } from "~/schemas/url"
import { trpc } from "~/utils/trpc"

import { oneGovSgFailurePath } from "../oneGovSgRedirect"

const queryValue = (value: string | string[] | undefined): string | undefined =>
  typeof value === "string" && value.length > 0 ? value : undefined

const RedirectToSignIn = (): JSX.Element => {
  const router = useRouter()

  useEffect(() => {
    void router.replace(oneGovSgFailurePath())
  }, [router])

  return <FullscreenSpinner />
}

interface CompleteOneGovSgLoginProps {
  state: string
  iss: string
  code?: string
  error?: string
}

const CompleteOneGovSgLogin = (
  input: CompleteOneGovSgLoginProps,
): JSX.Element => {
  const router = useRouter()
  const utils = trpc.useUtils()
  const { setHasLoginStateFlag } = useLoginState()

  // A code can be exchanged only once, so never retry or refetch.
  const { data, error } = trpc.auth.oneGovSg.callback.useQuery(input, {
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  })

  useEffect(() => {
    if (!data) {
      return
    }

    if (data.isLoggedIn) {
      setHasLoginStateFlag()
      void utils.me.get.invalidate()
      posthog.capture("user_logged_in", { method: "one.gov.sg" })
    }

    void router.replace(callbackUrlSchema.parse(data.redirectUrl))
  }, [data, router, setHasLoginStateFlag, utils.me.get])

  useEffect(() => {
    if (error) {
      void router.replace(oneGovSgFailurePath(error.data?.code))
    }
  }, [error, router])

  return <FullscreenSpinner />
}

/**
 * Handles the redirect back from one.gov.sg. The server validates and consumes
 * the login, including one.gov.sg error responses.
 */
export const OneGovSgCallback = (): JSX.Element => {
  const router = useRouter()

  if (!router.isReady) {
    return <FullscreenSpinner />
  }

  const state = queryValue(router.query.state)
  const iss = queryValue(router.query.iss)

  if (!state || !iss) {
    return <RedirectToSignIn />
  }

  return (
    <CompleteOneGovSgLogin
      state={state}
      iss={iss}
      code={queryValue(router.query.code)}
      error={queryValue(router.query.error)}
    />
  )
}
