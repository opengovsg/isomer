import { generators, Issuer, type Client } from "openid-client"
import { env } from "~/env.mjs"

import type { Logger } from "@isomer/logging"

import {
  SINGPASS_ENCRYPTION_JWK,
  SINGPASS_REDIRECT_URI,
  SINGPASS_SCOPES,
  SINGPASS_SIGNING_JWK,
} from "./singpass.constants"
import {
  createEphemeralDpopKey,
  importDpopPrivateKey,
  installDpopHeader,
  pushFapiAuthorizationRequest,
} from "./singpass.fapi"
import {
  singpassErrorCode,
  singpassLoginLogFields,
  singpassLogMessage,
} from "./singpass.observability"
import { extractUuid } from "./singpass.utils"

type SingpassAuthLogger = Pick<Logger, "info" | "error" | "warn">

let client: Client | null = null

// Lazy-initialise so that importing this module doesn't trigger a DNS lookup at
// module load time. auth.router.ts imports singpass.router.ts unconditionally,
// meaning every request (including email login when SingPass is skipped) would
// otherwise attempt to resolve SINGPASS_FAPI_ISSUER_ENDPOINT.
const assertSingpassEnabled = () => {
  // getIsSingpassEnabled() already returns false when SingPass is skipped, so
  // this code path should never be reached. Guard explicitly anyway to avoid a
  // DNS lookup against the placeholder issuer value set in preview.
  if (env.NEXT_PUBLIC_DANGEROUSLY_SKIP_SINGPASS) {
    throw new Error("SingPass is disabled in this environment")
  }
}

const clientKeys = {
  keys: [SINGPASS_SIGNING_JWK, SINGPASS_ENCRYPTION_JWK],
}

const getClient = async (): Promise<Client> => {
  assertSingpassEnabled()

  if (!client) {
    const singpassIssuer = await Issuer.discover(
      env.SINGPASS_FAPI_ISSUER_ENDPOINT,
    )
    const fapiClient = new singpassIssuer.FAPI2Client(
      {
        client_id: env.SINGPASS_CLIENT_ID,
        response_types: ["code"],
        token_endpoint_auth_method: "private_key_jwt",
        id_token_signed_response_alg: "ES256",
        id_token_encrypted_response_alg: env.SINGPASS_ENCRYPTION_KEY_ALG,
        // FAPI discovery only advertises A256CBC-HS512 for ID tokens
        // (A256GCM is the userinfo encryption).
        id_token_encrypted_response_enc: "A256CBC-HS512",
        dpop_bound_access_tokens: true,
      },
      clientKeys,
    )
    installDpopHeader(fapiClient)
    client = fapiClient
  }
  return client
}

interface SingpassAuthSession {
  codeVerifier: string
  nonce: string
  state: string
  dpopPrivateJwk: string
}

export const getAuthorizationUrl = async ({
  logger,
}: {
  logger?: SingpassAuthLogger
} = {}) => {
  const codeVerifier = generators.codeVerifier()
  const codeChallenge = generators.codeChallenge(codeVerifier)
  const nonce = generators.nonce()
  const state = generators.state()
  const { privateKey, privateJwk } = await createEphemeralDpopKey()
  const session: SingpassAuthSession = {
    codeVerifier,
    nonce,
    state,
    dpopPrivateJwk: privateJwk,
  }

  const singpassClient = await getClient()
  const authorizationUrl = await pushFapiAuthorizationRequest({
    client: singpassClient,
    clientId: env.SINGPASS_CLIENT_ID,
    privateKey,
    logger,
    parameters: {
      redirect_uri: SINGPASS_REDIRECT_URI,
      response_type: "code",
      scope: SINGPASS_SCOPES.join(" "),
      code_challenge_method: "S256",
      code_challenge: codeChallenge,
      nonce,
      state,
      authentication_context_type: "APP_AUTHENTICATION_DEFAULT",
    },
  })
  logger?.info(
    singpassLoginLogFields({
      stage: "authorization",
      outcome: "success",
    }),
    singpassLogMessage({
      message: "authorization URL built",
    }),
  )
  return { authorizationUrl, session }
}

interface LoginParams {
  code: string
  codeVerifier: string
  nonce: string
  state: string
  iss?: string
  dpopPrivateJwk: string
}

export const login = async ({
  code,
  codeVerifier,
  nonce,
  state,
  iss,
  dpopPrivateJwk,
  logger,
}: LoginParams & { logger?: SingpassAuthLogger }) => {
  const singpassClient = await getClient()
  try {
    const tokens = await singpassClient.callback(
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
      { DPoP: importDpopPrivateKey(dpopPrivateJwk) },
    )
    const uuid = extractUuid(tokens)
    if (!uuid) {
      logger?.error(
        singpassLoginLogFields({
          stage: "token_exchange",
          outcome: "failure",
          reason: "missing_uuid_in_id_token",
        }),
        singpassLogMessage({
          message: "token exchange returned no user UUID",
        }),
      )
    } else {
      logger?.info(
        singpassLoginLogFields({
          stage: "token_exchange",
          outcome: "success",
        }),
        singpassLogMessage({
          message: "token exchange succeeded",
        }),
      )
    }
    return { uuid }
  } catch (error) {
    logger?.error(
      {
        ...singpassLoginLogFields({
          stage: "token_exchange",
          outcome: "failure",
        }),
        singpassError: singpassErrorCode(error),
        err: error,
      },
      singpassLogMessage({
        message: "token exchange failed",
      }),
    )
    throw error
  }
}
