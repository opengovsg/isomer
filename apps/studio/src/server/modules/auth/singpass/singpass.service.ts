import type { Configuration } from "openid-client"
import * as client from "openid-client"
import { env } from "~/env.mjs"

import {
  SINGPASS_ENCRYPTION_KEY,
  SINGPASS_REDIRECT_URI,
  SINGPASS_SCOPES,
  SINGPASS_SIGNING_KEY,
} from "./singpass.constants"
import { extractUuid } from "./singpass.utils"

let singpassConfig: Configuration | null = null

// Lazy-initialise so that importing this module doesn't trigger a DNS lookup at
// module load time. auth.router.ts imports singpass.router.ts unconditionally,
// meaning every request (including email login when SingPass is skipped) would
// otherwise attempt to resolve SINGPASS_ISSUER_ENDPOINT.
const getSingpassConfig = async (): Promise<Configuration> => {
  // getIsSingpassEnabled() already returns false when SingPass is skipped, so
  // this code path should never be reached. Guard explicitly anyway to avoid a
  // DNS lookup against the placeholder SINGPASS_ISSUER_ENDPOINT value set in
  // preview.
  if (env.NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS) {
    throw new Error("SingPass is disabled in this environment")
  }

  if (!singpassConfig) {
    const issuer = new URL(env.SINGPASS_ISSUER_ENDPOINT)

    const config = await client.discovery(
      issuer,
      env.SINGPASS_CLIENT_ID,
      {
        id_token_signed_response_alg: "ES256",
      },
      client.PrivateKeyJwt(SINGPASS_SIGNING_KEY),
      // Mockpass (used in dev/test) is served over plain HTTP; production
      // Singpass is always HTTPS, so this only relaxes the check locally.
      issuer.protocol === "http:"
        ? { execute: [client.allowInsecureRequests] }
        : undefined,
    )
    client.enableDecryptingResponses(
      config,
      undefined,
      SINGPASS_ENCRYPTION_KEY,
    )

    singpassConfig = config
  }
  return singpassConfig
}

export const getAuthorizationUrl = async () => {
  const config = await getSingpassConfig()
  const codeVerifier = client.randomPKCECodeVerifier()
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier)
  const nonce = client.randomNonce()
  const state = client.randomState()

  const authorizationUrl = client.buildAuthorizationUrl(config, {
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

  return { authorizationUrl: authorizationUrl.href, session }
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
    const config = await getSingpassConfig()
    const stringifiedState = JSON.stringify(state)

    const currentUrl = new URL(SINGPASS_REDIRECT_URI)
    currentUrl.searchParams.set("code", code)
    currentUrl.searchParams.set("state", stringifiedState)

    const tokens = await client.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: codeVerifier,
      expectedNonce: nonce,
      expectedState: stringifiedState,
    })
    const uuid = extractUuid(tokens)
    return { uuid }
  } catch (e) {
    console.trace(e)
    throw e
  }
}
