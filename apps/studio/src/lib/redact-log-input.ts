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
const SIZE_ONLY_KEYS = new Set(["content", "blocks"])

const redactValue = (
  key: string,
  value: unknown,
  seen: WeakSet<object>,
): unknown => {
  const normalisedKey = key.toLowerCase()

  if (SENSITIVE_KEYS.has(normalisedKey)) {
    return REDACTED
  }

  if (SIZE_ONLY_KEYS.has(normalisedKey) && value != null) {
    if (typeof value === "string") return `[OMITTED: ${value.length} chars]`
    if (Array.isArray(value)) return `[OMITTED: ${value.length} items]`
    return "[OMITTED]"
  }

  return redactLogInput(value, seen)
}

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
      redactValue(key, value, seen),
    ]),
  )
}
