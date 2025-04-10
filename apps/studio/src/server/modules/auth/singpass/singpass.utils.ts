import type { TokenSet } from "openid-client"

export const extractUuid = (tokens: TokenSet) => {
  if (!tokens.id_token) {
    // No ID token happens when there is an error in communicating with Singpass
    return undefined
  }

  const data = tokens.claims()

  // Sub can be in the form of "s=<uid>,u=<uuid>" or "u=<uuid>" depending on the
  // type of Singpass app configured (NRIC/UUID or UUID only).
  // Ref: https://docs.developer.singpass.gov.sg/docs/technical-specifications/singpass-authentication-api/2.-token-endpoint/authorization-code-grant
  const subParts = data.sub.split(",")
  const uuidPart = subParts.find((part) => part.startsWith("u="))

  if (!uuidPart) {
    // Failed to extract the UUID from the ID token
    return undefined
  }

  return uuidPart.slice(2)
}
