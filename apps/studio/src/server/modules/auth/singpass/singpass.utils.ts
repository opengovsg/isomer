import type { TokenSet } from "openid-client"
import { errors } from "openid-client"

import { SingpassRequestError } from "./singpass.error"

// FAPI 2.0 ID tokens put the user UUID in `sub` directly. Legacy tokens use
// `u=<uuid>` inside a comma-separated list (`s=<nric>,u=<uuid>` or `u=<uuid>`).
const BARE_UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export const extractUuid = (tokens: TokenSet) => {
  if (!tokens.id_token) {
    // No ID token happens when there is an error in communicating with Singpass
    return undefined
  }

  const data = tokens.claims()
  const { sub } = data

  if (BARE_UUID.test(sub)) {
    return sub
  }

  const subParts = sub.split(",")
  const uuidPart = subParts.find((part) => part.startsWith("u="))

  if (!uuidPart) {
    return undefined
  }

  return uuidPart.slice(2)
}

export const singpassLogFields = (error: unknown) => {
  const cause = error instanceof SingpassRequestError ? error.cause : error
  const singpassError =
    error instanceof SingpassRequestError
      ? error.singpassError
      : error instanceof errors.OPError && typeof error.error === "string"
        ? error.error
        : undefined

  return {
    message: cause instanceof Error ? cause.message : "unknown",
    singpassError,
  }
}
