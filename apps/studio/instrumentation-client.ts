import posthog from "posthog-js"
import { env } from "~/env.mjs"

const posthogProjectToken = env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const posthogHost = env.NEXT_PUBLIC_POSTHOG_HOST

// NOTE: Since this is an analytics tracker,
// if we are missing the env vars, just no-op
if (posthogProjectToken && posthogHost) {
  const initOptions: Parameters<typeof posthog.init>[1] = {
    api_host: posthogHost,
    asset_host: env.NEXT_PUBLIC_POSTHOG_ASSETS_HOST,
    cross_subdomain_cookie: false,
    defaults: "2026-01-30",
    capture_exceptions: true,
    debug: env.NEXT_PUBLIC_APP_ENV === "development",
  }
  if (env.NEXT_PUBLIC_APP_URL) {
    initOptions.tracing_headers = [new URL(env.NEXT_PUBLIC_APP_URL).hostname]
  }
  posthog.init(posthogProjectToken, initOptions)
}
