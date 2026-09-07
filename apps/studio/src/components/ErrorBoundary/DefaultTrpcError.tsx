/* oxlint-disable typescript/switch-exhaustiveness-check -- studio lint cleanup */
import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc"
import type { FallbackProps } from "react-error-boundary"
import { useRouter } from "next/router"
import { trpc } from "~/utils/trpc"

import { FullscreenSpinner } from "../FullscreenSpinner"
import { DefaultNotFound } from "./DefaultNotFound"
import { DefaultServerError } from "./DefaultServerError"
import { UnexpectedErrorCard } from "./UnexpectedErrorCard"

const UnauthorizedError = ({
  resetErrorBoundary,
}: Pick<FallbackProps, "resetErrorBoundary">) => {
  const utils = trpc.useUtils()
  const router = useRouter()
  void utils.invalidate()
  void router.push("/")
  resetErrorBoundary()

  return <FullscreenSpinner />
}

// Deferred: Make custom components for these
export const DefaultTrpcError = ({
  code,
  resetErrorBoundary,
}: { code: TRPC_ERROR_CODE_KEY } & Pick<
  FallbackProps,
  "resetErrorBoundary"
>) => {
  switch (code) {
    case "NOT_FOUND": {
      return <DefaultNotFound />
    }

    case "UNAUTHORIZED": {
      // Deferred: add the default error boundary for perms here
      return <UnauthorizedError resetErrorBoundary={resetErrorBoundary} />
    }

    case "TIMEOUT":
    case "INTERNAL_SERVER_ERROR": {
      return <DefaultServerError />
    }

    default: {
      const _uncoveredErrors = code
      return <UnexpectedErrorCard />
    }
  }
}
