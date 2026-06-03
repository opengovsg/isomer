import { z } from "zod"

import type { Env } from "../env"
import { isWithinTimestampWindow, verifyHmacSha256 } from "../lib/hmac"

const SIGNATURE_HEADER = "x-anthropic-signature"
const TIMESTAMP_HEADER = "x-anthropic-timestamp"

const anthropicWebhookSchema = z
  .object({
    type: z.string(),
    session_id: z.string(),
    timestamp: z.string().datetime().optional(),
  })
  .passthrough()

export const handleAnthropicWebhook = async (
  request: Request,
  env: Env,
): Promise<Response> => {
  const rawBody = await request.text()
  const signatureHex = request.headers.get(SIGNATURE_HEADER) ?? ""

  if (!env.ANTHROPIC_WEBHOOK_SECRET) {
    console.error(
      "anthropic webhook received but ANTHROPIC_WEBHOOK_SECRET is unset",
    )
    return new Response("server not configured", { status: 503 })
  }

  const valid = await verifyHmacSha256({
    rawBody,
    signatureHex,
    secret: env.ANTHROPIC_WEBHOOK_SECRET,
  })
  if (!valid) {
    console.warn("anthropic webhook signature invalid")
    return new Response("bad signature", { status: 401 })
  }

  const headerTimestamp = request.headers.get(TIMESTAMP_HEADER)
  if (headerTimestamp !== null) {
    const ts = Number.parseInt(headerTimestamp, 10)
    if (
      !Number.isFinite(ts) ||
      !isWithinTimestampWindow({
        timestampMs: ts * 1000,
        nowMs: Date.now(),
        maxAgeSeconds: env.MAX_PAYLOAD_AGE_SECONDS,
      })
    ) {
      console.warn("anthropic webhook timestamp outside window", {
        headerTimestamp,
      })
      return new Response("stale", { status: 401 })
    }
  }

  const parsed = anthropicWebhookSchema.safeParse(JSON.parse(rawBody))
  if (!parsed.success) {
    console.warn("anthropic webhook payload failed schema validation", {
      issues: parsed.error.issues,
    })
    return new Response("bad payload", { status: 400 })
  }

  if (!env.LINEAR_AGENT_TRIGGER) {
    console.info("anthropic webhook accepted but trigger disabled", {
      type: parsed.data.type,
      sessionId: parsed.data.session_id,
    })
    return new Response(null, { status: 204 })
  }

  // TODO(stack 3.5 follow-up): route based on parsed.data.type
  //   - session.status_idle → swap Linear label agent:running → agent:idle
  //   - session.completed   → clear agent:* labels, optionally post summary
  //   - session.failed      → clear labels, post failure comment with audit link
  console.info("anthropic webhook would dispatch (trigger enabled)", {
    type: parsed.data.type,
    sessionId: parsed.data.session_id,
  })
  return new Response(null, { status: 202 })
}
