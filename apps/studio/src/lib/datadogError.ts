import { datadogRum } from "@datadog/browser-rum"

// Side effects (analytics, etc.) live in a dedicated module rather than inline
// in components, mirroring `lib/intercom.ts`.
export const reportClientError = (
  error: unknown,
  context?: Record<string, unknown>,
): void => {
  datadogRum.addError(error, context)
}
