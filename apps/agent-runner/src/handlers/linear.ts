import { z } from "zod"

import type { Env } from "../env"
import { isWithinTimestampWindow, verifyHmacSha256 } from "../lib/hmac"

const SIGNATURE_HEADER = "linear-signature"
const TIMESTAMP_HEADER = "linear-delivery-timestamp"

const linearWebhookSchema = z
  .object({
    action: z.string(),
    type: z.string(),
    webhookTimestamp: z.number(),
    data: z
      .object({
        id: z.string(),
      })
      .passthrough(),
  })
  .passthrough()

export const handleLinearWebhook = async (
  request: Request,
  env: Env,
): Promise<Response> => {
  const rawBody = await request.text()
  const signatureHex = request.headers.get(SIGNATURE_HEADER) ?? ""

  if (!env.LINEAR_WEBHOOK_SECRET) {
    console.error("linear webhook received but LINEAR_WEBHOOK_SECRET is unset")
    return new Response("server not configured", { status: 503 })
  }

  const valid = await verifyHmacSha256({
    rawBody,
    signatureHex,
    secret: env.LINEAR_WEBHOOK_SECRET,
  })
  if (!valid) {
    console.warn("linear webhook signature invalid")
    return new Response("bad signature", { status: 401 })
  }

  const headerTimestamp = request.headers.get(TIMESTAMP_HEADER)
  if (headerTimestamp !== null) {
    const ts = Number.parseInt(headerTimestamp, 10)
    if (
      !Number.isFinite(ts) ||
      !isWithinTimestampWindow({
        timestampMs: ts,
        nowMs: Date.now(),
        maxAgeSeconds: env.MAX_PAYLOAD_AGE_SECONDS,
      })
    ) {
      console.warn("linear webhook timestamp outside window", {
        headerTimestamp,
      })
      return new Response("stale", { status: 401 })
    }
  }

  const parsed = linearWebhookSchema.safeParse(JSON.parse(rawBody))
  if (!parsed.success) {
    console.warn("linear webhook payload failed schema validation", {
      issues: parsed.error.issues,
    })
    return new Response("bad payload", { status: 400 })
  }

  if (!env.LINEAR_AGENT_TRIGGER) {
    console.info("linear webhook accepted but trigger disabled", {
      action: parsed.data.action,
      type: parsed.data.type,
      id: parsed.data.data.id,
    })
    return new Response(null, { status: 204 })
  }

  // TODO(stack 3.4 follow-up): route based on parsed.data.type
  //   - Issue + action=update with newly-added ai:implement label → start session
  //   - Comment + body matching /pick:\s*[ABC]/ → resume idle session
  console.info("linear webhook would dispatch (trigger enabled)", {
    action: parsed.data.action,
    type: parsed.data.type,
    id: parsed.data.data.id,
  })
  return new Response(null, { status: 202 })
}
