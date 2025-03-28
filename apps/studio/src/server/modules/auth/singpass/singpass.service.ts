import { generators, Issuer } from "openid-client"

import { env } from "~/env.mjs"
import {
  SINGPASS_ENCRYPTION_JWK,
  SINGPASS_REDIRECT_URI,
  SINGPASS_SCOPES,
  SINGPASS_SIGN_IN_STATE,
  SINGPASS_SIGNING_JWK,
} from "./singpass.constants"
import { extractUuid } from "./singpass.utils"

const singpassIssuer = await Issuer.discover(env.SINGPASS_ISSUER_ENDPOINT)
const singpassClient = new singpassIssuer.Client(
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
const state = JSON.stringify({ state: SINGPASS_SIGN_IN_STATE })

export const getAuthorizationUrl = () => {
  const codeVerifier = generators.codeVerifier()
  const codeChallenge = generators.codeChallenge(codeVerifier)
  const nonce = generators.nonce()

  const authorizationUrl = singpassClient.authorizationUrl({
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
}

export const login = async ({ code, codeVerifier, nonce }: LoginParams) => {
  const tokens = await singpassClient.callback(
    SINGPASS_REDIRECT_URI,
    {
      code,
      state,
    },
    {
      state,
      code_verifier: codeVerifier,
      nonce,
    },
  )
  const uuid = extractUuid(tokens)
  return { uuid }
}
