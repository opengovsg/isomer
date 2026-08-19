import { calculateJwkThumbprint, exportJWK, importPKCS8 } from "jose"
import { env } from "~/env.mjs"
import { getBaseUrl } from "~/utils/getBaseUrl"

export const SINGPASS_SCOPES = ["openid"]

export const SINGPASS_REDIRECT_URI =
  env.SINGPASS_REDIRECT_URI ??
  new URL("/sign-in/singpass/callback", getBaseUrl()).href

const SINGPASS_SIGNING_CRYPTO_KEY = await importPKCS8(
  env.SINGPASS_SIGNING_PRIVATE_KEY,
  env.SINGPASS_SIGNING_KEY_ALG,
  {
    extractable: true,
  },
)

const SINGPASS_ENCRYPTION_CRYPTO_KEY = await importPKCS8(
  env.SINGPASS_ENCRYPTION_PRIVATE_KEY,
  env.SINGPASS_ENCRYPTION_KEY_ALG,
  {
    extractable: true,
  },
)

// openid-client@6 takes CryptoKey-based key objects (rather than JWKs)
// for client authentication and response decryption.
export const SINGPASS_SIGNING_KEY = {
  key: SINGPASS_SIGNING_CRYPTO_KEY,
  kid: await calculateJwkThumbprint(
    await exportJWK(SINGPASS_SIGNING_CRYPTO_KEY),
  ),
}

export const SINGPASS_ENCRYPTION_KEY = {
  key: SINGPASS_ENCRYPTION_CRYPTO_KEY,
  kid: await calculateJwkThumbprint(
    await exportJWK(SINGPASS_ENCRYPTION_CRYPTO_KEY),
  ),
  alg: env.SINGPASS_ENCRYPTION_KEY_ALG,
}
