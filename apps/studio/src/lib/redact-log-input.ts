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
