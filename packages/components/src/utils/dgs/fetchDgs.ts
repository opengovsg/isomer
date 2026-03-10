/**
 * Wrapper around fetch that auto-injects the data.gov.sg API key when present.
 * Works without the API key—requests succeed either way. The key is only for
 * avoiding rate limits during local development and CI (Storybook/Chromatic).
 * Reference: https://guide.data.gov.sg/developer-guide/api-overview/how-to-use-your-api-key
 */
export const fetchDgs = (
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> => {
  const headers = new Headers(init?.headers)
  const apiKey = getDgsApiKey()
  if (apiKey) {
    headers.set("x-api-key", apiKey)
  }
  return fetch(input, { ...init, headers })
}

const getDgsApiKey = (): string | undefined => {
  const key = process.env.DATAGOVSG_API_KEY
  return typeof key === "string" ? key.trim() || undefined : undefined
}
