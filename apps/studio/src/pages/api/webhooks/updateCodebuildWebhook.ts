import type { NextApiRequest, NextApiResponse } from "next"
import { TRPCError } from "@trpc/server"
import { getHTTPStatusCodeFromError } from "@trpc/server/http"
import { webhookHandlers } from "~/server/webhooks"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") { res.status(405).send("Method Not Allowed"); return;}
  try {
    const result = await webhookHandlers.updateCodebuildWebhook(req, res)
    res.status(200).json(result)
  } catch (error) {
    if (error instanceof TRPCError) {
      const httpCode = getHTTPStatusCodeFromError(error)
       res.status(httpCode).json({
        error: error.message,
      }); return;
    } else {
      res.status(500).json({
        error: error instanceof Error ? error.message : "Unknown error encountered",
      })
    }
  }
}
