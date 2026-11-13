const REDACTED = "[REDACTED]"

const SENSITIVE_KEYS = new Set([
  "token",
  "otp",
  "password",
  "apikey",
  "secret",
  "authorization",
  "accesstoken",
  "refreshtoken",
])

// OAuth callbacks carry the authorization code and state; keep them out of logs.
const UNLOGGED_INPUT_PATHS = new Set([
  "auth.oneGovSg.callback",
  "auth.singpass.callback",
])

const isSensitiveKey = (key: string) => SENSITIVE_KEYS.has(key.toLowerCase())

export const redactLogInput = (input: unknown): unknown => {
  if (input === null || input === undefined) {
    return input
  }

  if (Array.isArray(input)) {
    return input.map(redactLogInput)
  }

  if (typeof input === "object") {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        isSensitiveKey(key) ? REDACTED : redactLogInput(value),
      ]),
    )
  }

  return input
}

export const getLoggableInput = (path: string, input: unknown): unknown =>
  UNLOGGED_INPUT_PATHS.has(path) ? REDACTED : redactLogInput(input)
