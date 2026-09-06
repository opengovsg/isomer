type JsonPrimitive = string | number | boolean | null
interface ParsedJsonRecord {
  [key: string]: ParsedJsonValue
}
type ParsedJsonValue = JsonPrimitive | ParsedJsonValue[] | ParsedJsonRecord
type UnparsedJsonInput = string | ParsedJsonValue | undefined

export const safeJsonParse = <T>(value: UnparsedJsonInput): T | undefined => {
  if (value === undefined || value === null) return undefined

  // If value is a string, try to parse
  if (Object.prototype.toString.call(value) === "[object String]") {
    try {
      // SAFETY: JSON.parse output is validated by callers at their domain boundary
      return JSON.parse(value as string) as T
    } catch {
      console.warn("Failed to parse JSON:", value)
      return undefined
    }
  }

  // If value is already an object (not a string), return as is
  if (Object(value) === value) {
    // SAFETY: boundary parser accepts in-memory objects already parsed upstream
    return value as T
  }

  // For other types (number, boolean, etc.), return undefined
  return undefined
}
