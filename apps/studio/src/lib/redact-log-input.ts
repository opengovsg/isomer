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

const REPEATED = "[REPEATED]"

// A repeated object (shared reference or cycle) is logged once, then as a
// marker, so neither this walk nor pino's JSON.stringify expands it again.
export const redactLogInput = (
  input: unknown,
  seen = new WeakSet<object>(),
): unknown => {
  if (input === null || typeof input !== "object") {
    return input
  }
  if (seen.has(input)) {
    return REPEATED
  }
  seen.add(input)

  if (Array.isArray(input)) {
    return input.map((value) => redactLogInput(value, seen))
  }

  return Object.fromEntries(
    Object.entries(input).map(([key, value]) => [
      key,
      isSensitiveKey(key) ? REDACTED : redactLogInput(value, seen),
    ]),
  )
}

export const getLoggableInput = (path: string, input: unknown): unknown =>
  UNLOGGED_INPUT_PATHS.has(path) ? REDACTED : redactLogInput(input)
