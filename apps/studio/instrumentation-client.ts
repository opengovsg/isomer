import posthog from "posthog-js"

const posthogProjectToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const posthogHost = process.env.NEXT_PUBLIC_POSTHOG_HOST

if (!posthogProjectToken || !posthogHost) {
  if (process.env.NODE_ENV !== "production") {
    throw new Error(
      !posthogProjectToken
        ? "NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN is configured"
        : "NEXT_PUBLIC_POSTHOG_HOST variable required by PostHog is missing or un-configured, this causes events to be silently missed. This error stops appearing once NEXT_PUBLIC_POSTHOG_HOST is configured",
    )
  }
} else {
  posthog.init(posthogProjectToken, {
    api_host: posthogHost,
    defaults: "2026-01-30",
    capture_exceptions: true,
    ...(process.env.NEXT_PUBLIC_APP_URL
      ? { tracing_headers: [new URL(process.env.NEXT_PUBLIC_APP_URL).hostname] }
      : {}),
    debug: process.env.NODE_ENV === "development",
  })
}
