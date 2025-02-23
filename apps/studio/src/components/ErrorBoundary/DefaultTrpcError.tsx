import { useRouter } from "next/router"
import { type TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc"
import { FallbackProps } from "react-error-boundary"

import { trpc } from "~/utils/trpc"
import { FullscreenSpinner } from "../FullscreenSpinner"
import { DefaultNotFound } from "./DefaultNotFound"
import { DefaultServerError } from "./DefaultServerError"
import { UnexpectedErrorCard } from "./UnexpectedErrorCard"

export const UnauthorizedError = ({
  resetErrorBoundary,
}: Pick<FallbackProps, "resetErrorBoundary">) => {
  const utils = trpc.useUtils()
  const router = useRouter()
  void utils.invalidate()
  void router.push("/")
  void resetErrorBoundary()

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
