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
  "phone",
  // Singpass authorisation code
  "code",
])

// Page and SVG bodies can run to megabytes; their size is enough to debug with
const SIZE_ONLY_KEYS = new Set(["content"])

const redactValue = (key: string, value: unknown): unknown => {
  const normalisedKey = key.toLowerCase()

  if (SENSITIVE_KEYS.has(normalisedKey)) {
    return REDACTED
  }

  if (SIZE_ONLY_KEYS.has(normalisedKey) && value != null) {
    const length =
      typeof value === "string" ? value.length : JSON.stringify(value).length
    return `[OMITTED: ${length} chars]`
  }

  return redactLogInput(value)
}

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
        redactValue(key, value),
      ]),
    )
  }

  return input
}
