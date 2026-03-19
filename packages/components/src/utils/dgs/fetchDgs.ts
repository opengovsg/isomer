/**
 * Configuration for `fetchDgs`.
 *
 * Consumers are responsible for providing the data.gov.sg API key (if any) via
 * the `getApiKey` callback. This keeps environment-variable access outside of
 * the shared components library.
 */
interface DgsConfig {
  getApiKey?: () => string | undefined
}

let dgsConfig: DgsConfig = {}

/**
 * Configure how `fetchDgs` obtains the data.gov.sg API key.
 *
 * Example (in an app or Storybook setup file):
 *   configureDgs({
 *     getApiKey: () => process.env.DATAGOVSG_API_KEY,
 *   })
 */
export const configureDgs = (next: DgsConfig): void => {
  dgsConfig = { ...dgsConfig, ...next }
}

const getConfiguredApiKey = (): string | undefined => {
  const key = dgsConfig.getApiKey?.()
  return typeof key === "string" ? key.trim() || undefined : undefined
}

/**
 * Wrapper around fetch that optionally injects the data.gov.sg API key when
 * provided via `configureDgs`.
 *
 * Works without the API key—requests succeed either way. The key is only for
 * avoiding rate limits during local development and CI (Storybook/Chromatic).
 * Reference: https://guide.data.gov.sg/developer-guide/api-overview/how-to-use-your-api-key
 */
export const fetchDgs = (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const headers = new Headers(init?.headers)
  const apiKey = getConfiguredApiKey()
  if (apiKey) {
    headers.set("x-api-key", apiKey)
  }
  return fetch(input, { ...init, headers })
}
