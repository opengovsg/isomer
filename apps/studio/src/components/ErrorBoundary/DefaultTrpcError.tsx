import { useEffect } from "react"
import { useRouter } from "next/router"
import { type TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc"

import { trpc } from "~/utils/trpc"
import { DefaultNotFound } from "./DefaultNotFound"
import { DefaultServerError } from "./DefaultServerError"
import { UnexpectedErrorCard } from "./UnexpectedErrorCard"

export const UnauthorizedError = () => {
  const utils = trpc.useUtils()
  const router = useRouter()
  useEffect(() => {
    void utils.invalidate()
    void router.push("/")
  }, [utils, router])

  return null
}

// TODO: Make custom components for these
export function DefaultTrpcError({ code }: { code: TRPC_ERROR_CODE_KEY }) {
  switch (code) {
    case "NOT_FOUND":
      return <DefaultNotFound />

    case "UNAUTHORIZED":
      // TODO: add the default error boundary for perms here
      return <UnauthorizedError />

    case "TIMEOUT":
    case "INTERNAL_SERVER_ERROR":
      return <DefaultServerError />

    default:
      const _uncoveredErrors = code
      return <UnexpectedErrorCard />
  }
}
