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
