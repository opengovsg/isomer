import type { SessionData } from "~/lib/types/session"
import { calculateJwkThumbprint, exportJWK, importPKCS8 } from "jose"
import { errors, generators, Issuer, type Client } from "openid-client"
import { env } from "~/env.mjs"
import { createBaseLogger } from "~/lib/logger"
import { SIGN_IN_ONE_GOV_SG_CALLBACK } from "~/lib/routes"
import { ONE_GOV_SG_LOGIN_METHOD } from "~/lib/types/session"
import { getBaseUrl } from "~/utils/getBaseUrl"

import { db } from "../../database"

export type OneGovSgSessionState = NonNullable<
  NonNullable<SessionData["oneGovSg"]>["sessionState"]
>

const ONE_GOV_SG_SCOPE = "openid email"
const ONE_GOV_SG_SIGNING_ALG = "RS256"
// Must outlast an officer entering their one.gov.sg OTP.
const ONE_GOV_SG_TRANSACTION_TTL_MS = 10 * 60 * 1000

// From config only, never request headers, so both legs send the same string.
const ONE_GOV_SG_REDIRECT_URI =
  env.ONE_GOV_SG_REDIRECT_URI ??
  new URL(SIGN_IN_ONE_GOV_SG_CALLBACK, getBaseUrl()).href

const IS_ONE_GOV_SG_ENABLED =
  !!env.ONE_GOV_SG_CLIENT_ID && !!env.ONE_GOV_SG_PRIVATE_KEY

if (
  !IS_ONE_GOV_SG_ENABLED &&
  (env.ONE_GOV_SG_CLIENT_ID || env.ONE_GOV_SG_PRIVATE_KEY)
) {
  createBaseLogger({ path: "auth.oneGovSg" }).warn(
    `one.gov.sg login disabled: ${env.ONE_GOV_SG_CLIENT_ID ? "ONE_GOV_SG_PRIVATE_KEY" : "ONE_GOV_SG_CLIENT_ID"} is not set`,
  )
}

export const isOneGovSgEnabled = () => IS_ONE_GOV_SG_ENABLED

let client: Client | null = null

// Lazy so a disabled or misconfigured deployment never calls discovery. A failed
// discovery is not cached, so a transient outage doesn't need a restart.
const getClient = async (): Promise<Client> => {
  if (client) {
    return client
  }

  const clientId = env.ONE_GOV_SG_CLIENT_ID
  const privateKeyPem = env.ONE_GOV_SG_PRIVATE_KEY
  if (!clientId || !privateKeyPem) {
    throw new Error("one.gov.sg login is not configured")
  }

  // Secret stores may flatten the PEM's newlines into literal `\n`.
  const privateKey = await exportJWK(
    await importPKCS8(
      privateKeyPem.replaceAll("\\n", "\n"),
      ONE_GOV_SG_SIGNING_ALG,
      { extractable: true },
    ),
  )

  const issuer = await Issuer.discover(env.ONE_GOV_SG_ISSUER)
  // openid-client v5 does not compare the discovered issuer to the one asked for.
  if (issuer.issuer !== env.ONE_GOV_SG_ISSUER) {
    throw new Error("one.gov.sg discovery issuer mismatch")
  }

  client = new issuer.Client(
    {
      client_id: clientId,
      redirect_uris: [ONE_GOV_SG_REDIRECT_URI],
      response_types: ["code"],
      token_endpoint_auth_method: "private_key_jwt",
      token_endpoint_auth_signing_alg: ONE_GOV_SG_SIGNING_ALG,
      id_token_signed_response_alg: ONE_GOV_SG_SIGNING_ALG,
    },
    {
      keys: [
        {
          ...privateKey,
          use: "sig",
          alg: ONE_GOV_SG_SIGNING_ALG,
          // one.gov.sg needs `kid` to pick the key once a rotation adds a second.
          kid: await calculateJwkThumbprint(privateKey),
        },
      ],
    },
  )
  return client
}

export const getAuthorizationUrl = async () => {
  const session: OneGovSgSessionState = {
    codeVerifier: generators.codeVerifier(),
    nonce: generators.nonce(),
    state: generators.state(),
    expiresAt: Date.now() + ONE_GOV_SG_TRANSACTION_TTL_MS,
  }

  const authorizationUrl = (await getClient()).authorizationUrl({
    redirect_uri: ONE_GOV_SG_REDIRECT_URI,
    scope: ONE_GOV_SG_SCOPE,
    code_challenge_method: "S256",
    code_challenge: generators.codeChallenge(session.codeVerifier),
    nonce: session.nonce,
    state: session.state,
  })

  return { authorizationUrl, session }
}

// The sealed session cookie can be replayed, so each login also gets a
// server-side row that the callback deletes exactly once before the exchange.
// one.gov.sg identifiers never collide with OTP ones (`email|ip`).
const ONE_GOV_SG_PENDING_LOGIN_PREFIX = `${ONE_GOV_SG_LOGIN_METHOD}|`

export const recordPendingLogin = async ({
  state,
  expiresAt,
}: OneGovSgSessionState) => {
  await db.transaction().execute(async (tx) => {
    // ponytail: expired rows are swept on each login start, add a cron if
    // login traffic ever makes this scan noticeable.
    await tx
      .deleteFrom("VerificationToken")
      .where("identifier", "like", `${ONE_GOV_SG_PENDING_LOGIN_PREFIX}%`)
      .where("expires", "<", new Date())
      .execute()

    await tx
      .insertInto("VerificationToken")
      .values({
        identifier: `${ONE_GOV_SG_PENDING_LOGIN_PREFIX}${state}`,
        token: "",
        expires: new Date(expiresAt),
      })
      .execute()
  })
}

/** Atomically consumes the pending login; false if missing, used or expired. */
export const consumePendingLogin = async (state: string): Promise<boolean> => {
  const consumed = await db
    .deleteFrom("VerificationToken")
    .where("identifier", "=", `${ONE_GOV_SG_PENDING_LOGIN_PREFIX}${state}`)
    .where("expires", ">", new Date())
    .returning("identifier")
    .executeTakeFirst()

  return consumed !== undefined
}

/**
 * A log-safe failure category. openid-client errors carry the raw id_token
 * (`jwt`) and IdP-controlled text, so only fixed values are kept.
 */
export const describeOneGovSgError = (error: unknown): string => {
  if (error instanceof errors.OPError) {
    return `op_error:${error.error}`
  }
  if (error instanceof errors.RPError) {
    return "id_token_validation"
  }
  if (error instanceof Error) {
    return error.message
  }
  return "unknown"
}

interface ExchangeCodeParams {
  code: string
  iss: string
  session: OneGovSgSessionState
}

/** Returns the officer's email. openid-client checks state, nonce, PKCE and id_token. */
export const exchangeCode = async ({
  code,
  iss,
  session,
}: ExchangeCodeParams): Promise<string> => {
  const tokenSet = await (
    await getClient()
  ).callback(
    ONE_GOV_SG_REDIRECT_URI,
    { code, state: session.state, iss },
    {
      state: session.state,
      nonce: session.nonce,
      code_verifier: session.codeVerifier,
    },
  )
  const { aud, sub } = tokenSet.claims()

  // openid-client accepts our client_id anywhere in a multi-valued `aud`.
  const audiences = Array.isArray(aud) ? aud : [aud]
  if (audiences.length !== 1 || audiences[0] !== env.ONE_GOV_SG_CLIENT_ID) {
    throw new Error("one.gov.sg id_token has an unexpected audience")
  }

  // `sub` is the officer's normalised email and the stable user key.
  return sub.trim().toLowerCase()
}
