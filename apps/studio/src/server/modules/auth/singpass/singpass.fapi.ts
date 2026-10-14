import { exportJWK, importJWK, SignJWT } from "jose"
import { AsyncLocalStorage } from "node:async_hooks"
import crypto, { type KeyObject } from "node:crypto"
import {
  custom,
  errors,
  type AuthorizationParameters,
  type Client,
} from "openid-client"

import type { Logger } from "@isomer/logging"

import {
  singpassErrorCode,
  singpassLoginLogFields,
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

export const importDpopPrivateKey = async (
  privateJwk: string,
): Promise<KeyObject> => {
  const key = await importJWK(JSON.parse(privateJwk), "ES256")
  if (!(key instanceof crypto.KeyObject)) {
    throw new Error("Invalid DPoP key")
  }
  return key
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
    "Singpass FAPI PAR starting",
  )

  try {
    const pushed = await push()
    logger?.info(
      singpassLoginLogFields({
        useFapi: true,
        stage: "par",
        outcome: "success",
        parAttempt: 1,
        dpopNonceRetry: false,
      }),
      "Singpass FAPI PAR succeeded",
    )
    return buildFapiRedirectUrl(
      authorizationEndpoint,
      clientId,
      pushed.request_uri,
    )
  } catch (error) {
    const nonce = readDpopNonce(error)
    const errorCode = singpassErrorCode(error)
    if (errorCode !== "use_dpop_nonce" || !nonce) {
      logger?.error(
        {
          ...singpassLoginLogFields({
            useFapi: true,
            stage: "par",
            outcome: "failure",
            parAttempt: 1,
            dpopNonceRetry: false,
          }),
          singpassError: errorCode,
        },
        "Singpass FAPI PAR failed",
      )
      throw error
    }
    logger?.warn(
      singpassLoginLogFields({
        useFapi: true,
        stage: "par",
        parPhase: "dpop_nonce_retry",
        parAttempt: 1,
        singpassError: errorCode,
      }),
      "Singpass FAPI PAR retrying with DPoP nonce",
    )
    try {
      const pushed = await push(nonce)
      logger?.info(
        singpassLoginLogFields({
          useFapi: true,
          stage: "par",
          outcome: "success",
          parAttempt: 2,
          dpopNonceRetry: true,
        }),
        "Singpass FAPI PAR succeeded after DPoP nonce retry",
      )
      return buildFapiRedirectUrl(
        authorizationEndpoint,
        clientId,
        pushed.request_uri,
      )
    } catch (retryError) {
      logger?.error(
        {
          ...singpassLoginLogFields({
            useFapi: true,
            stage: "par",
            outcome: "failure",
            parAttempt: 2,
            dpopNonceRetry: true,
          }),
          singpassError: singpassErrorCode(retryError),
        },
        "Singpass FAPI PAR failed after DPoP nonce retry",
      )
      throw retryError
    }
  }
}
