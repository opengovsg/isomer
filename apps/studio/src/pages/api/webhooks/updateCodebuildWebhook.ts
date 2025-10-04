import type { NextApiRequest, NextApiResponse } from "next"
import { TRPCError } from "@trpc/server"
import { getHTTPStatusCodeFromError } from "@trpc/server/http"

import { webhookHandlers } from "~/server/webhooks"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed")
  try {
    const result = await webhookHandlers.updateCodebuildWebhook(req, res)
    res.status(200).json(result)
  } catch (err) {
    if (err instanceof TRPCError) {
      const httpCode = getHTTPStatusCodeFromError(err)
      return res.status(httpCode).json({
        error: err.message,
      })
    } else {
      res.status(500).json({
        error: err instanceof Error ? err.message : "Unknown error encountered",
      })
    }
  }
}
