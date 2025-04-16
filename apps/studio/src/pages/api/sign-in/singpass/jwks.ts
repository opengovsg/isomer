import crypto from "crypto"
import { type NextApiRequest, type NextApiResponse } from "next"
import { calculateJwkThumbprint, exportJWK } from "jose"

import { env } from "~/env.mjs"
import { createBaseLogger } from "~/lib/logger"

const logger = createBaseLogger({ path: "singpass-jwks" })

async function constructPublicJWK({
  key,
  use,
  alg,
}: {
  key: string
  use: "sig" | "enc"
  alg: string
}) {
  const keyObj = crypto.createPublicKey(key)
  const jwk = await exportJWK(keyObj)
  const kid = await calculateJwkThumbprint(jwk)
  return { ...jwk, kid, use, alg }
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  try {
    if (request.method === "GET") {
      const encryptionKey = await constructPublicJWK({
        key: env.SINGPASS_ENCRYPTION_PRIVATE_KEY,
        use: "enc",
        alg: env.SINGPASS_ENCRYPTION_KEY_ALG,
      })
      const signingKey = await constructPublicJWK({
        key: env.SINGPASS_SIGNING_PRIVATE_KEY,
        use: "sig",
        alg: env.SINGPASS_SIGNING_KEY_ALG,
      })

      return response.status(200).json({ keys: [encryptionKey, signingKey] })
    } else {
      response.setHeader("Allow", "GET")
      return response.status(405).end()
    }
  } catch (error) {
    logger.error({
      error: "Failed to respond to Singpass public JWKS request",
      action: "handler",
      originalError: error,
    })
    return response.status(500).end()
  }
}
