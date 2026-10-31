import { backOff } from "exponential-backoff"
import { exportJWK, SignJWT } from "jose"
import { AsyncLocalStorage } from "node:async_hooks"
import crypto, { type KeyObject } from "node:crypto"
import {
  custom,
  errors,
  type AuthorizationParameters,
  type Client,
} from "openid-client"
import { z } from "zod"

import type { Logger } from "@isomer/logging"

import {
  singpassErrorCode,
  singpassLoginLogFields,
  singpassLogMessage,
} from "./singpass.observability"

type SingpassFapiLogger = Pick<Logger, "info" | "error" | "warn">

// The FAPI client is cached and shared. A module-level header would leak one
// user's DPoP proof into another in-flight login, so the proof travels in
// async context and the client's HTTP hook copies it onto that request only.
const dpopProofHeader = new AsyncLocalStorage<string>()

export const installDpopHeader = (client: Client): void => {
  client[custom.http_options] = (_url, options) => {
    const proof = dpopProofHeader.getStore()
    if (!proof) return {}
    return {
      headers: {
        ...options.headers,
        DPoP: proof,
      },
    }
  }
}

export const createEphemeralDpopKey = async (): Promise<{
  privateKey: KeyObject
  privateJwk: string
}> => {
  const { privateKey } = crypto.generateKeyPairSync("ec", {
    namedCurve: "P-256",
  })
  const jwk = await exportJWK(privateKey)
  return { privateKey, privateJwk: JSON.stringify(jwk) }
}

const dpopEcPrivateJwkSchema = z.object({
  kty: z.literal("EC"),
  crv: z.string().min(1),
  x: z.string().min(1),
  y: z.string().min(1),
  d: z.string().min(1),
})

export const importDpopPrivateKey = (privateJwk: string): KeyObject => {
  let parsed: unknown
  try {
    parsed = JSON.parse(privateJwk)
  } catch {
    throw new Error("Invalid DPoP private key JSON in session")
  }

  const result = dpopEcPrivateJwkSchema.safeParse(parsed)
  if (!result.success) {
    throw new Error("Invalid DPoP private key shape in session")
  }

  return crypto.createPrivateKey({
    key: result.data,
    format: "jwk",
  })
}

const endpointUrl = (value: unknown, name: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Singpass discovery is missing ${name}`)
  }
  return value
}

// DPoP `htu` is the scheme, host, and path. Query and fragment are excluded.
const dpopHtu = (endpoint: string): string => {
  const url = new URL(endpoint)
  return `${url.origin}${url.pathname}`
}

const createDpopProof = async ({
  privateKey,
  htm,
  htu,
  nonce,
}: {
  privateKey: KeyObject
  htm: "GET" | "POST"
  htu: string
  nonce?: string
}): Promise<string> => {
  const privateJwk = await exportJWK(privateKey)
  const publicJwk = {
    kty: privateJwk.kty,
    crv: privateJwk.crv,
    x: privateJwk.x,
    y: privateJwk.y,
  }

  return await new SignJWT({
    htm,
    htu,
    ...(nonce ? { nonce } : {}),
  })
    .setProtectedHeader({ alg: "ES256", typ: "dpop+jwt", jwk: publicJwk })
    .setIssuedAt()
    .setJti(crypto.randomUUID())
    .setExpirationTime("2m")
    .sign(privateKey)
}

const buildFapiRedirectUrl = (
  authorizationEndpoint: string,
  clientId: string,
  requestUri: string,
): string => {
  const url = new URL(authorizationEndpoint)
  url.search = ""
  url.searchParams.set("client_id", clientId)
  url.searchParams.set("request_uri", requestUri)
  return url.href
}

const readDpopNonce = (error: unknown): string | undefined => {
  if (!(error instanceof errors.OPError) || !error.response) return undefined
  const headers = error.response.headers as
    | Record<string, string | string[] | undefined>
    | undefined
  const value = headers?.["dpop-nonce"]
  return typeof value === "string" && value.length > 0 ? value : undefined
}

// Singpass PAR error table: retry server_error, upstream_dependency_error, and
// temporarily_unavailable up to 3 times with exponential backoff.
// https://docs.developer.singpass.gov.sg/docs/technical-specifications/integration-guide/1.-authorization-request
// Four attempts is the first request plus those 3 retries (1s, then 2s, then 4s).
// use_dpop_nonce is not in that table; the next proof must carry the nonce immediately.
const TRANSIENT_PAR_ERRORS = new Set([
  "server_error",
  "upstream_dependency_error",
  "temporarily_unavailable",
])
const MAX_PAR_ATTEMPTS = 4
const PAR_BACKOFF_STARTING_DELAY_MS = 1000
const PAR_BACKOFF_MAX_DELAY_MS = 4000

const nextParNonce = (error: unknown): string | undefined => {
  if (singpassErrorCode(error) !== "use_dpop_nonce") return undefined
  return readDpopNonce(error)
}

const isTransientParError = (error: unknown): boolean => {
  const errorCode = singpassErrorCode(error)
  return errorCode !== undefined && TRANSIENT_PAR_ERRORS.has(errorCode)
}

export const pushFapiAuthorizationRequest = async ({
  client,
  clientId,
  privateKey,
  parameters,
  logger,
}: {
  client: Client
  clientId: string
  privateKey: KeyObject
  parameters: AuthorizationParameters
  logger?: SingpassFapiLogger
}): Promise<string> => {
  const parEndpoint = endpointUrl(
    client.issuer.metadata.pushed_authorization_request_endpoint,
    "pushed_authorization_request_endpoint",
  )
  const authorizationEndpoint = endpointUrl(
    client.issuer.metadata.authorization_endpoint,
    "authorization_endpoint",
  )
  const htu = dpopHtu(parEndpoint)

  const push = async (nonce?: string) => {
    const proof = await createDpopProof({
      privateKey,
      htm: "POST",
      htu,
      nonce,
    })
    return dpopProofHeader.run(proof, () =>
      client.pushedAuthorizationRequest(parameters),
    )
  }

  logger?.info(
    singpassLoginLogFields({
      useFapi: true,
      stage: "par",
      parPhase: "start",
      parAttempt: 1,
    }),
    singpassLogMessage({ useFapi: true, message: "PAR starting" }),
  )

  let nonce: string | undefined
  let attempt = 0
  let dpopNonceRetry = false

  try {
    const pushed = await backOff(
      async () => {
        attempt += 1
        try {
          return await push(nonce)
        } catch (error) {
          const retryNonce = nextParNonce(error)
          if (!retryNonce) throw error
          // Keep a nonce the server already issued. A later transient retry
          // still sends it. Only use_dpop_nonce replaces it.
          nonce = retryNonce
          dpopNonceRetry = true
          logger?.warn(
            singpassLoginLogFields({
              useFapi: true,
              stage: "par",
              parPhase: "dpop_nonce_retry",
              parAttempt: attempt,
              singpassError: singpassErrorCode(error),
            }),
            singpassLogMessage({
              useFapi: true,
              message: "PAR retrying with DPoP nonce",
            }),
          )
          return await push(retryNonce)
        }
      },
      {
        numOfAttempts: MAX_PAR_ATTEMPTS,
        startingDelay: PAR_BACKOFF_STARTING_DELAY_MS,
        maxDelay: PAR_BACKOFF_MAX_DELAY_MS,
        retry: (error, failedAttempt) => {
          if (!isTransientParError(error)) return false
          logger?.warn(
            singpassLoginLogFields({
              useFapi: true,
              stage: "par",
              parPhase: "transient_retry",
              parAttempt: failedAttempt,
              singpassError: singpassErrorCode(error),
            }),
            singpassLogMessage({
              useFapi: true,
              message: "PAR retrying after transient error",
            }),
          )
          return true
        },
      },
    )
    logger?.info(
      singpassLoginLogFields({
        useFapi: true,
        stage: "par",
        outcome: "success",
        parAttempt: attempt,
        dpopNonceRetry,
      }),
      singpassLogMessage({
        useFapi: true,
        message: dpopNonceRetry
          ? "PAR succeeded after DPoP nonce retry"
          : "PAR succeeded",
      }),
    )
    return buildFapiRedirectUrl(
      authorizationEndpoint,
      clientId,
      pushed.request_uri,
    )
  } catch (error) {
    logger?.error(
      {
        ...singpassLoginLogFields({
          useFapi: true,
          stage: "par",
          outcome: "failure",
          parAttempt: attempt,
          dpopNonceRetry,
        }),
        singpassError: singpassErrorCode(error),
        err: error,
      },
      singpassLogMessage({ useFapi: true, message: "PAR failed" }),
    )
    throw error
  }
}
