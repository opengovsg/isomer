import type { NextApiRequest, NextApiResponse } from "next"

import { webhookHandlers } from "~/schemas/webhook"

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed")
  try {
    const result = await webhookHandlers.updateCodebuildWebhook(req, res)
    res.status(200).json(result)
  } catch (err) {
    res.status(500).json({
      error: err instanceof Error ? err.message : "Unknown error encountered",
    })
  }
}
