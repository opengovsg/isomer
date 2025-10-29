export const safeJsonParse = <T>(value: unknown): T | undefined => {
  if (value === undefined || value === null) return undefined

  // If value is already an object (not a string), return as is
  if (typeof value === "object") {
    return value as T
  }

  // If value is a string, try to parse
  if (typeof value === "string") {
    try {
      return JSON.parse(value) as T
    } catch {
      console.warn("Failed to parse JSON:", value)
      return undefined
    }
  }

  // For other types (number, boolean, etc.), return undefined
  return undefined
}
