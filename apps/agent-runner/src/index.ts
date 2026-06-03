import { parseEnv } from "./env"
import { handleAnthropicWebhook } from "./handlers/anthropic"
import { handleLinearWebhook } from "./handlers/linear"

export default {
  async fetch(request: Request, rawEnv: unknown): Promise<Response> {
    const url = new URL(request.url)

    if (request.method !== "POST") {
      return new Response("method not allowed", { status: 405 })
    }

    const env = parseEnv(rawEnv)

    switch (url.pathname) {
      case "/linear":
        return handleLinearWebhook(request, env)
      case "/anthropic":
        return handleAnthropicWebhook(request, env)
      default:
        return new Response("not found", { status: 404 })
    }
  },
} satisfies ExportedHandler<unknown>
