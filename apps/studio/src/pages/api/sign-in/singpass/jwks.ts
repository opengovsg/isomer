import crypto from "node:crypto"
import { calculateJwkThumbprint, exportJWK } from "jose"
import type { NextApiRequest, NextApiResponse } from "next"
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
  return { ...jwk, alg, kid, use }
}

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  try {
    if (request.method === "GET") {
      const encryptionKey = await constructPublicJWK({
        alg: env.SINGPASS_ENCRYPTION_KEY_ALG,
        key: env.SINGPASS_ENCRYPTION_PRIVATE_KEY,
        use: "enc",
      })
      const signingKey = await constructPublicJWK({
        alg: env.SINGPASS_SIGNING_KEY_ALG,
        key: env.SINGPASS_SIGNING_PRIVATE_KEY,
        use: "sig",
      })

       response.status(200).json({ keys: [encryptionKey, signingKey] }); return;
    }
      response.setHeader("Allow", "GET")
      return response.status(405).end()
    
  } catch (error) {
    logger.error({
      action: "handler",
      error: "Failed to respond to Singpass public JWKS request",
      originalError: error,
    })
    return response.status(500).end()
  }
}
