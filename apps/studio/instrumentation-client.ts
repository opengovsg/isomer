import posthog from "posthog-js"
import { env } from "~/env.mjs"

const posthogProjectToken = env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const posthogHost = env.NEXT_PUBLIC_POSTHOG_HOST

// env.mjs enforces that both vars are set in staging/production, so a missing
// value here just means analytics is unconfigured for this environment (dev,
// test, preview, ...) — treat it as a no-op rather than blocking app boot.
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
