import { errors, generators, Issuer, type Client } from "openid-client"
import { env } from "~/env.mjs"

import {
  SINGPASS_ENCRYPTION_JWK,
  SINGPASS_ID_TOKEN_CONTENT_ENCRYPTION,
  SINGPASS_REDIRECT_URI,
  SINGPASS_SCOPES,
  SINGPASS_SIGNING_JWK,
} from "./singpass.constants"
import { SingpassRequestError } from "./singpass.error"
import {
  createEphemeralDpopKey,
  fapiAuthorizationParameters,
  importDpopPrivateKey,
  installDpopHeader,
  pushFapiAuthorizationRequest,
} from "./singpass.fapi"
import { extractUuid } from "./singpass.utils"

let legacyClient: Client | null = null
let fapiClient: Client | null = null

// Lazy-initialise so that importing this module doesn't trigger a DNS lookup at
// module load time. auth.router.ts imports singpass.router.ts unconditionally,
// meaning every request (including email login when SingPass is skipped) would
// otherwise attempt to resolve SINGPASS_ISSUER_ENDPOINT.
const assertSingpassEnabled = () => {
  // getIsSingpassEnabled() already returns false when SingPass is skipped, so
  // this code path should never be reached. Guard explicitly anyway to avoid a
  // DNS lookup against the placeholder SINGPASS_ISSUER_ENDPOINT value set in
  // preview.
  if (env.NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS) {
    throw new SingpassRequestError("SingPass is disabled in this environment")
  }
}

const clientKeys = {
  keys: [SINGPASS_SIGNING_JWK, SINGPASS_ENCRYPTION_JWK],
}

const getLegacyClient = async (): Promise<Client> => {
  assertSingpassEnabled()
  if (!legacyClient) {
    const singpassIssuer = await Issuer.discover(env.SINGPASS_ISSUER_ENDPOINT)
    legacyClient = new singpassIssuer.Client(
      {
        client_id: env.SINGPASS_CLIENT_ID,
        response_types: ["code"],
        token_endpoint_auth_method: "private_key_jwt",
        id_token_signed_response_alg: "ES256",
      },
      clientKeys,
    )
  }
  return legacyClient
}

const getFapiClient = async (): Promise<Client> => {
  assertSingpassEnabled()
  const issuer = env.SINGPASS_FAPI_ISSUER_ENDPOINT
  if (!issuer) {
    throw new SingpassRequestError(
      "SINGPASS_FAPI_ISSUER_ENDPOINT is not configured",
    )
  }

  if (!fapiClient) {
    const singpassIssuer = await Issuer.discover(issuer)
    const client = new singpassIssuer.FAPI2Client(
      {
        client_id: env.SINGPASS_CLIENT_ID,
        response_types: ["code"],
        token_endpoint_auth_method: "private_key_jwt",
        id_token_signed_response_alg: "ES256",
        id_token_encrypted_response_alg: env.SINGPASS_ENCRYPTION_KEY_ALG,
        id_token_encrypted_response_enc: SINGPASS_ID_TOKEN_CONTENT_ENCRYPTION,
        dpop_bound_access_tokens: true,
      },
      clientKeys,
    )
    installDpopHeader(client)
    fapiClient = client
  }
  return fapiClient
}

export const resetSingpassClientsForTests = () => {
  legacyClient = null
  fapiClient = null
}

const singpassErrorCode = (error: unknown): string | undefined => {
  if (error instanceof errors.OPError && typeof error.error === "string") {
    return error.error
  }
  return undefined
}

const toSingpassRequestError = (error: unknown): SingpassRequestError => {
  if (error instanceof SingpassRequestError) return error
  return new SingpassRequestError("Singpass request failed", {
    cause: error,
    singpassError: singpassErrorCode(error),
  })
}

export interface SingpassAuthSession {
  codeVerifier: string
  nonce: string
  state: string
  useFapi: boolean
  dpopPrivateJwk?: string
}

export const getAuthorizationUrl = async ({
  useFapi,
}: {
  useFapi: boolean
}) => {
  const codeVerifier = generators.codeVerifier()
  const codeChallenge = generators.codeChallenge(codeVerifier)
  const nonce = generators.nonce()
  const state = generators.state()
  const session: SingpassAuthSession = {
    codeVerifier,
    nonce,
    state,
    useFapi,
  }

  try {
    if (!useFapi) {
      const client = await getLegacyClient()
      const authorizationUrl = client.authorizationUrl({
        redirect_uri: SINGPASS_REDIRECT_URI,
        code_challenge_method: "S256",
        code_challenge: codeChallenge,
        nonce,
        state,
        scope: SINGPASS_SCOPES.join(" "),
      })
      return { authorizationUrl, session }
    }

    const { privateKey, privateJwk } = await createEphemeralDpopKey()
    session.dpopPrivateJwk = privateJwk
    const client = await getFapiClient()
    const authorizationUrl = await pushFapiAuthorizationRequest({
      client,
      clientId: env.SINGPASS_CLIENT_ID,
      privateKey,
      parameters: fapiAuthorizationParameters({
        redirectUri: SINGPASS_REDIRECT_URI,
        codeChallenge,
        nonce,
        state,
      }),
    })
    return { authorizationUrl, session }
  } catch (error) {
    throw toSingpassRequestError(error)
  }
}

interface LoginParams {
  code: string
  codeVerifier: string
  nonce: string
  state: string
  useFapi: boolean
  dpopPrivateJwk?: string
  iss?: string
}

export const login = async ({
  code,
  codeVerifier,
  nonce,
  state,
  useFapi,
  dpopPrivateJwk,
  iss,
}: LoginParams) => {
  try {
    const client = useFapi ? await getFapiClient() : await getLegacyClient()
    if (useFapi && !dpopPrivateJwk) {
      throw new SingpassRequestError(
        "Missing DPoP key for Singpass token exchange",
      )
    }
    const tokens = await client.callback(
      SINGPASS_REDIRECT_URI,
      {
        code,
        state,
        ...(iss ? { iss } : {}),
      },
      {
        state,
        code_verifier: codeVerifier,
        nonce,
      },
      useFapi && dpopPrivateJwk
        ? { DPoP: await importDpopPrivateKey(dpopPrivateJwk) }
        : undefined,
    )
    return { uuid: extractUuid(tokens) }
  } catch (error) {
    throw toSingpassRequestError(error)
  }
}
