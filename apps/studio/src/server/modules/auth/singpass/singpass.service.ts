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
    throw new Error("SingPass is disabled in this environment")
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

  if (!fapiClient) {
    const singpassIssuer = await Issuer.discover(
      env.SINGPASS_FAPI_ISSUER_ENDPOINT,
    )
    const client = new singpassIssuer.FAPI2Client(
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
    installDpopHeader(client)
    fapiClient = client
  }
  return fapiClient
}

interface SingpassAuthSession {
  codeVerifier: string
  nonce: string
  state: string
  useFapi: boolean
  dpopPrivateJwk?: string
}

export const getAuthorizationUrl = async ({
  useFapi,
  logger,
}: {
  useFapi: boolean
  logger?: SingpassAuthLogger
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

  if (!useFapi) {
    try {
      const client = await getLegacyClient()
      const authorizationUrl = client.authorizationUrl({
        redirect_uri: SINGPASS_REDIRECT_URI,
        code_challenge_method: "S256",
        code_challenge: codeChallenge,
        nonce,
        state,
        scope: SINGPASS_SCOPES.join(" "),
      })
      logger?.info(
        singpassLoginLogFields({
          useFapi: false,
          stage: "authorization",
          outcome: "success",
        }),
        singpassLogMessage({
          useFapi: false,
          message: "authorization URL built",
        }),
      )
      return { authorizationUrl, session }
    } catch (error) {
      logger?.error(
        {
          ...singpassLoginLogFields({
            useFapi: false,
            stage: "authorization",
            outcome: "failure",
          }),
          singpassError: singpassErrorCode(error),
          err: error,
        },
        singpassLogMessage({
          useFapi: false,
          message: "authorization request failed",
        }),
      )
      throw error
    }
  }

  const { privateKey, privateJwk } = await createEphemeralDpopKey()
  session.dpopPrivateJwk = privateJwk
  const client = await getFapiClient()
  const authorizationUrl = await pushFapiAuthorizationRequest({
    client,
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
      useFapi: true,
      stage: "authorization",
      outcome: "success",
    }),
    singpassLogMessage({
      useFapi: true,
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
  useFapi: boolean
  dpopPrivateJwk?: string
}

export const login = async ({
  code,
  codeVerifier,
  nonce,
  state,
  iss,
  useFapi,
  dpopPrivateJwk,
  logger,
}: LoginParams & { logger?: SingpassAuthLogger }) => {
  const client = useFapi ? await getFapiClient() : await getLegacyClient()
  if (useFapi && !dpopPrivateJwk) {
    logger?.error(
      singpassLoginLogFields({
        useFapi: true,
        stage: "token_exchange",
        outcome: "failure",
        reason: "missing_dpop_key",
      }),
      singpassLogMessage({
        useFapi: true,
        message: "token exchange aborted",
      }),
    )
    throw new Error("Missing DPoP key for Singpass token exchange")
  }
  try {
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
        ? { DPoP: importDpopPrivateKey(dpopPrivateJwk) }
        : undefined,
    )
    const uuid = extractUuid(tokens)
    if (!uuid) {
      logger?.error(
        singpassLoginLogFields({
          useFapi,
          stage: "token_exchange",
          outcome: "failure",
          reason: "missing_uuid_in_id_token",
        }),
        singpassLogMessage({
          useFapi,
          message: "token exchange returned no user UUID",
        }),
      )
    } else {
      logger?.info(
        singpassLoginLogFields({
          useFapi,
          stage: "token_exchange",
          outcome: "success",
        }),
        singpassLogMessage({
          useFapi,
          message: "token exchange succeeded",
        }),
      )
    }
    return { uuid }
  } catch (error) {
    logger?.error(
      {
        ...singpassLoginLogFields({
          useFapi,
          stage: "token_exchange",
          outcome: "failure",
        }),
        singpassError: singpassErrorCode(error),
        err: error,
      },
      singpassLogMessage({
        useFapi,
        message: "token exchange failed",
      }),
    )
    throw error
  }
}
