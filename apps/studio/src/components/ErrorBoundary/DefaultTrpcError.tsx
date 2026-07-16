import type { FallbackProps } from "react-error-boundary"
import { type TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { SIGN_IN } from "~/lib/routes"
import { callbackUrlSchema } from "~/schemas/url"
import { appendWithRedirect } from "~/utils/url"

import { FullscreenSpinner } from "../FullscreenSpinner"
import { DefaultNotFound } from "./DefaultNotFound"
import { DefaultServerError } from "./DefaultServerError"
import { UnexpectedErrorCard } from "./UnexpectedErrorCard"

const UnauthorizedError = ({
  resetErrorBoundary,
}: Pick<FallbackProps, "resetErrorBoundary">) => {
  const router = useRouter()

  useEffect(() => {
    const { pathname, search, hash } = window.location
    const callbackUrl = encodeURIComponent(`${pathname}${search}${hash}`)

    void router
      .replace(
        callbackUrlSchema.parse(appendWithRedirect(SIGN_IN, callbackUrl)),
      )
      .then(resetErrorBoundary)
  }, [resetErrorBoundary, router])

  return <FullscreenSpinner />
}

// TODO: Make custom components for these
export function DefaultTrpcError({
  code,
  resetErrorBoundary,
}: { code: TRPC_ERROR_CODE_KEY } & Pick<FallbackProps, "resetErrorBoundary">) {
  switch (code) {
    case "NOT_FOUND":
      return <DefaultNotFound />

    case "UNAUTHORIZED":
      // TODO: add the default error boundary for perms here
      return <UnauthorizedError resetErrorBoundary={resetErrorBoundary} />

    case "TIMEOUT":
    case "INTERNAL_SERVER_ERROR":
      return <DefaultServerError />

    default:
      const _uncoveredErrors = code
      return <UnexpectedErrorCard />
  }
}
