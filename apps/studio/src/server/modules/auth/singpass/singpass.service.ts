import type { Client } from "openid-client"
import { generators, Issuer } from "openid-client"
import { env } from "~/env.mjs"

import {
  SINGPASS_ENCRYPTION_JWK,
  SINGPASS_REDIRECT_URI,
  SINGPASS_SCOPES,
  SINGPASS_SIGNING_JWK,
} from "./singpass.constants"
import { extractUuid } from "./singpass.utils"

let singpassClient: Client | null = null

// Lazy-initialise so that importing this module doesn't trigger a DNS lookup at
// module load time. auth.router.ts imports singpass.router.ts unconditionally,
// meaning every request (including email login in preview, where SingPass is
// disabled) would otherwise attempt to resolve SINGPASS_ISSUER_ENDPOINT.
const getSingpassClient = async (): Promise<Client> => {
  // getIsSingpassEnabled() already returns false for preview, so this code path
  // should never be reached. Guard explicitly anyway to avoid a DNS lookup
  // against the placeholder SINGPASS_ISSUER_ENDPOINT value set in preview.
  if (env.NEXT_PUBLIC_APP_ENV === "preview") {
    throw new Error("SingPass is not available in preview environments")
  }

  if (!singpassClient) {
    const singpassIssuer = await Issuer.discover(env.SINGPASS_ISSUER_ENDPOINT)
    singpassClient = new singpassIssuer.Client(
      {
        client_id: env.SINGPASS_CLIENT_ID,
        response_types: ["code"],
        token_endpoint_auth_method: "private_key_jwt",
        id_token_signed_response_alg: "ES256",
      },
      {
        keys: [SINGPASS_SIGNING_JWK, SINGPASS_ENCRYPTION_JWK],
      },
    )
  }
  return singpassClient
}

export const getAuthorizationUrl = async () => {
  const client = await getSingpassClient()
  const codeVerifier = generators.codeVerifier()
  const codeChallenge = generators.codeChallenge(codeVerifier)
  const nonce = generators.nonce()
  const state = generators.state()

  const authorizationUrl = client.authorizationUrl({
    redirect_uri: SINGPASS_REDIRECT_URI,
    code_challenge_method: "S256",
    code_challenge: codeChallenge,
    nonce,
    state,
    scope: SINGPASS_SCOPES.join(" "),
  })
  const session = {
    codeVerifier,
    nonce,
  }

  return { authorizationUrl, session }
}

interface LoginParams {
  code: string
  codeVerifier: string
  nonce: string
  state: string
}

export const login = async ({
  code,
  codeVerifier,
  nonce,
  state,
}: LoginParams) => {
  try {
    const client = await getSingpassClient()
    const stringifiedState = JSON.stringify(state)
    const tokens = await client.callback(
      SINGPASS_REDIRECT_URI,
      {
        code,
        state: stringifiedState,
      },
      {
        state: stringifiedState,
        code_verifier: codeVerifier,
        nonce,
      },
    )
    const uuid = extractUuid(tokens)
    return { uuid }
  } catch (e) {
    console.trace(e)
    throw e
  }
}
