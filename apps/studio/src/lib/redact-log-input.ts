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

// `seen` maps each input object to its copy, so shared references (superjson
// `referentialEqualities`) are copied once and cycles terminate.
export const redactLogInput = (
  input: unknown,
  seen = new WeakMap<object, unknown>(),
): unknown => {
  if (input === null || typeof input !== "object") {
    return input
  }

  const copied = seen.get(input)
  if (copied !== undefined) {
    return copied
  }

  if (Array.isArray(input)) {
    const result: unknown[] = []
    seen.set(input, result)
    for (const value of input) result.push(redactLogInput(value, seen))
    return result
  }

  const result: Record<string, unknown> = {}
  seen.set(input, result)
  for (const [key, value] of Object.entries(input)) {
    result[key] = isSensitiveKey(key) ? REDACTED : redactLogInput(value, seen)
  }
  return result
}
