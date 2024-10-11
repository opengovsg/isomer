import { useEffect } from "react"
import { Box } from "@chakra-ui/react"
import { type TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc"

import { trpc } from "~/utils/trpc"
import { FullscreenSpinner } from "../FullscreenSpinner"
import { DefaultNotFound } from "./DefaultNotFound"
import { UnexpectedErrorCard } from "./UnexpectedErrorCard"

function UnauthorizedError() {
  const utils = trpc.useUtils()
  useEffect(() => {
    void utils.invalidate()
  }, [utils])

  return <FullscreenSpinner />
}

// TODO: Make custom components for these
export function DefaultTrpcError({ code }: { code: TRPC_ERROR_CODE_KEY }) {
  switch (code) {
    case "NOT_FOUND":
      return <DefaultNotFound />

    case "UNAUTHORIZED":
      return <UnauthorizedError />

    default:
      const uncoveredErrors = code
      return <UnexpectedErrorCard />
  }
}
