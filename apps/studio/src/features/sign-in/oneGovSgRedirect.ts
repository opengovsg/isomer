import type { TRPC_ERROR_CODE_KEY } from "@trpc/server/rpc"
import { SIGN_IN } from "~/lib/routes"

import type { SignInErrorType } from "./components/SignInContext"

export const ONE_GOV_SG_ERROR_QUERY_KEY = "oneGovSgError"

// Our own values only: one.gov.sg's and the server's error text never reach the page.
const UNAUTHORIZED = "unauthorized"
const FAILED = "failed"

export const oneGovSgFailurePath = (code?: TRPC_ERROR_CODE_KEY): string =>
  `${SIGN_IN}?${ONE_GOV_SG_ERROR_QUERY_KEY}=${code === "UNAUTHORIZED" ? UNAUTHORIZED : FAILED}`

export const oneGovSgSignInError = (
  value: string | string[] | undefined,
): SignInErrorType | undefined => {
  if (value === UNAUTHORIZED) {
    return "unauthorized"
  }
  if (value === FAILED) {
    return "oneGovSgFailed"
  }
  return undefined
}
