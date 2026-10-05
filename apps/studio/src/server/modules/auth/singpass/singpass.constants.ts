import { calculateJwkThumbprint, exportJWK, importPKCS8 } from "jose"
import { env } from "~/env.mjs"
import { getBaseUrl } from "~/utils/getBaseUrl"

export const SINGPASS_SCOPES = ["openid"]

// Required on FAPI Login apps. Studio sign-in is a general authentication,
// not a payment or account-change event.
export const SINGPASS_AUTHENTICATION_CONTEXT_TYPE = "APP_AUTHENTICATION_DEFAULT"
export const SINGPASS_AUTHENTICATION_CONTEXT_MESSAGE =
  "Sign in to Isomer Studio"

// JWE content encryption paired with ECDH-ES+A256KW key wrapping.
// Singpass documents this as AES256GCM.
export const SINGPASS_ID_TOKEN_CONTENT_ENCRYPTION = "A256GCM"

export const SINGPASS_REDIRECT_URI =
  env.SINGPASS_REDIRECT_URI ??
  new URL("/sign-in/singpass/callback", getBaseUrl()).href

const SINGPASS_SIGNING_KEY = await exportJWK(
  await importPKCS8(
    env.SINGPASS_SIGNING_PRIVATE_KEY,
    env.SINGPASS_SIGNING_KEY_ALG,
    {
      extractable: true,
    },
  ),
)

const SINGPASS_ENCRYPTION_KEY = await exportJWK(
  await importPKCS8(
    env.SINGPASS_ENCRYPTION_PRIVATE_KEY,
    env.SINGPASS_ENCRYPTION_KEY_ALG,
    {
      extractable: true,
    },
  ),
)

export const SINGPASS_SIGNING_JWK = {
  ...SINGPASS_SIGNING_KEY,
  use: "sig",
  alg: env.SINGPASS_SIGNING_KEY_ALG,
  kid: await calculateJwkThumbprint(SINGPASS_SIGNING_KEY),
}

export const SINGPASS_ENCRYPTION_JWK = {
  ...SINGPASS_ENCRYPTION_KEY,
  use: "enc",
  alg: env.SINGPASS_ENCRYPTION_KEY_ALG,
  kid: await calculateJwkThumbprint(SINGPASS_ENCRYPTION_KEY),
}
