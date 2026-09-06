/* oxlint-disable typescript/no-unsafe-type-assertion, typescript/no-unnecessary-type-parameters -- JSON.parse cannot preserve generic types without boundary assertions */
type JsonPrimitive = string | number | boolean | null
interface ParsedJsonRecord {
  [key: string]: ParsedJsonValue
}
type ParsedJsonValue = JsonPrimitive | ParsedJsonValue[] | ParsedJsonRecord
type UnparsedJsonInput = string | ParsedJsonValue | undefined

const isJsonString = (value: UnparsedJsonInput): value is string =>
  Object.prototype.toString.call(value) === "[object String]"

const isParsedJsonValue = (
  value: UnparsedJsonInput,
): value is ParsedJsonValue =>
  value !== undefined && value !== null && Object(value) === value

export const safeJsonParse = <T extends ParsedJsonValue>(
  value: UnparsedJsonInput,
): T | undefined => {
  if (value === undefined || value === null) {
    return undefined
  }

  if (isJsonString(value)) {
    try {
      // SAFETY: JSON.parse output is validated by callers at their domain boundary
      const parsed = JSON.parse(value) as T
      return parsed
    } catch {
      console.warn("Failed to parse JSON:", value)
      return undefined
    }
  }

  if (isParsedJsonValue(value)) {
    // SAFETY: callers constrain T to the parsed JSON shape they consume
    const parsed: T = value as T
    return parsed
  }

  return undefined
}
