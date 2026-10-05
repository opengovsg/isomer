import { exportJWK, importJWK, SignJWT } from "jose"
import { AsyncLocalStorage } from "node:async_hooks"
import crypto, { type KeyObject } from "node:crypto"
import {
  custom,
  errors,
  type AuthorizationParameters,
  type Client,
} from "openid-client"

import {
  SINGPASS_AUTHENTICATION_CONTEXT_MESSAGE,
  SINGPASS_AUTHENTICATION_CONTEXT_TYPE,
  SINGPASS_SCOPES,
} from "./singpass.constants"
import { SingpassRequestError } from "./singpass.error"

// The FAPI client is cached and shared. A module-level header would leak one
// user's DPoP proof into another in-flight login, so the proof travels in
// async context and the client's HTTP hook copies it onto that request only.
const dpopProofHeader = new AsyncLocalStorage<string>()

const RETRYABLE_SINGPASS_ERRORS = new Set([
  "server_error",
  "upstream_dependency_error",
  "temporarily_unavailable",
])

// One attempt plus up to three retries, matching Singpass's retry guidance.
const MAX_SINGPASS_ATTEMPTS = 4

const sleep = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms)
  })

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

const isKeyObject = (key: unknown): key is KeyObject =>
  key instanceof crypto.KeyObject

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null

export const importDpopPrivateKey = async (
  privateJwk: string,
): Promise<KeyObject> => {
  let parsed: unknown
  try {
    parsed = JSON.parse(privateJwk)
  } catch {
    throw new SingpassRequestError("Invalid DPoP key")
  }
  if (!isRecord(parsed)) {
    throw new SingpassRequestError("Invalid DPoP key")
  }
  const record = parsed
  if (
    record.kty !== "EC" ||
    typeof record.crv !== "string" ||
    typeof record.x !== "string" ||
    typeof record.y !== "string" ||
    typeof record.d !== "string"
  ) {
    throw new SingpassRequestError("Invalid DPoP key")
  }

  const key = await importJWK(
    {
      kty: "EC",
      crv: record.crv,
      x: record.x,
      y: record.y,
      d: record.d,
    },
    "ES256",
  )
  if (!isKeyObject(key)) {
    throw new SingpassRequestError("Invalid DPoP key")
  }
  return key
}

const endpointUrl = (value: unknown, name: string): string => {
  if (typeof value !== "string" || value.length === 0) {
    throw new SingpassRequestError(`Singpass discovery is missing ${name}`)
  }
  return value
}

// DPoP `htu` is the scheme, host, and path. Query and fragment are excluded.
export const dpopHtu = (endpoint: string): string => {
  const url = new URL(endpoint)
  return `${url.origin}${url.pathname}`
}

export const createDpopProof = async ({
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

export const buildFapiRedirectUrl = (
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

const singpassErrorCode = (error: unknown): string | undefined => {
  if (error instanceof errors.OPError && typeof error.error === "string") {
    return error.error
  }
  return undefined
}

const readDpopNonce = (error: unknown): string | undefined => {
  if (!(error instanceof errors.OPError) || !error.response) return undefined
  const headers = error.response.headers as
    | Record<string, string | string[] | undefined>
    | undefined
  const value = headers?.["dpop-nonce"]
  return typeof value === "string" && value.length > 0 ? value : undefined
}

export const fapiAuthorizationParameters = ({
  redirectUri,
  codeChallenge,
  nonce,
  state,
}: {
  redirectUri: string
  codeChallenge: string
  nonce: string
  state: string
}): AuthorizationParameters => ({
  redirect_uri: redirectUri,
  response_type: "code",
  scope: SINGPASS_SCOPES.join(" "),
  code_challenge_method: "S256",
  code_challenge: codeChallenge,
  nonce,
  state,
  authentication_context_type: SINGPASS_AUTHENTICATION_CONTEXT_TYPE,
  authentication_context_message: SINGPASS_AUTHENTICATION_CONTEXT_MESSAGE,
})

export const pushFapiAuthorizationRequest = async ({
  client,
  clientId,
  privateKey,
  parameters,
}: {
  client: Client
  clientId: string
  privateKey: KeyObject
  parameters: AuthorizationParameters
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
  let dpopNonce: string | undefined

  for (let attempt = 0; attempt < MAX_SINGPASS_ATTEMPTS; attempt += 1) {
    const proof = await createDpopProof({
      privateKey,
      htm: "POST",
      htu,
      nonce: dpopNonce,
    })

    try {
      const pushed = await dpopProofHeader.run(proof, () =>
        client.pushedAuthorizationRequest(parameters),
      )
      return buildFapiRedirectUrl(
        authorizationEndpoint,
        clientId,
        pushed.request_uri,
      )
    } catch (error) {
      const nonce = readDpopNonce(error)
      if (singpassErrorCode(error) === "use_dpop_nonce" && nonce) {
        dpopNonce = nonce
        continue
      }

      const code = singpassErrorCode(error)
      if (
        code &&
        RETRYABLE_SINGPASS_ERRORS.has(code) &&
        attempt < MAX_SINGPASS_ATTEMPTS - 1
      ) {
        await sleep(200 * 2 ** attempt)
        continue
      }

      throw error
    }
  }

  throw new SingpassRequestError("Singpass authorization request failed")
}

export const dpopProofHeaderForTests = <T>(proof: string, fn: () => T): T =>
  dpopProofHeader.run(proof, fn)
