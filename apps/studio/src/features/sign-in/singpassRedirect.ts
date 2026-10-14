import { SIGN_IN_SINGPASS } from "~/lib/routes"

// Singpass's own error text is not copied into the page. These values are ours.
const RETRY = "retry"
const UNAVAILABLE = "unavailable"

export type SingpassSignInError = "retry" | "unavailable" | "generic"

export const singpassCallbackFailurePath = (
  singpassError: string | undefined,
): string => {
  if (singpassError === "server_error") {
    return `${SIGN_IN_SINGPASS}?error=${RETRY}`
  }
  if (singpassError === "temporarily_unavailable") {
    return `${SIGN_IN_SINGPASS}?error=${UNAVAILABLE}`
  }
  return `${SIGN_IN_SINGPASS}?error=true`
}

export const singpassSignInError = (
  error: string | string[] | undefined,
): SingpassSignInError | null => {
  if (error === RETRY) return "retry"
  if (error === UNAVAILABLE) return "unavailable"
  if (typeof error === "string" && error.length > 0) return "generic"
  if (Array.isArray(error) && error.some((value) => value.length > 0)) {
    return "generic"
  }
  return null
}
