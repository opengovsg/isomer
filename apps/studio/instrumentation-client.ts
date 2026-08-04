import posthog from "posthog-js"
import { env } from "~/env.mjs"

const posthogProjectToken = env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const posthogHost = env.NEXT_PUBLIC_POSTHOG_HOST

// NOTE: Since this is an analytics tracker,
// if we are missing the env vars, just no-op
if (posthogProjectToken && posthogHost) {
  posthog.init(posthogProjectToken, {
    api_host: posthogHost,
    asset_host: env.NEXT_PUBLIC_POSTHOG_ASSETS_HOST,
    defaults: "2026-01-30",
    capture_exceptions: true,
    ...(env.NEXT_PUBLIC_APP_URL
      ? { tracing_headers: [new URL(env.NEXT_PUBLIC_APP_URL).hostname] }
      : {}),
    debug: env.NEXT_PUBLIC_APP_ENV === "development",
  })
}
