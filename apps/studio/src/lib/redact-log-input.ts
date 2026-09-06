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

interface RedactableObject {
  [key: string]: RedactableValue
}

type RedactableValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | RedactableValue[]
  | RedactableObject

const isRedactableRecord = (input: RedactableValue): input is RedactableObject =>
  input !== null && Object(input) === input && !Array.isArray(input)

export const redactLogInput = (input: RedactableValue): RedactableValue => {
  if (input === null || input === undefined) {
    return input
  }

  if (Array.isArray(input)) {
    return input.map(redactLogInput)
  }

  if (isRedactableRecord(input)) {
    return Object.fromEntries(
      Object.entries(input).map(([key, value]) => [
        key,
        isSensitiveKey(key) ? REDACTED : redactLogInput(value),
      ]),
    )
  }

  return input
}
