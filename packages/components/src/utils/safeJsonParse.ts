export const safeJsonParse = <T>(value: string | undefined): T | undefined => {
  if (!value) return undefined
  try {
    return JSON.parse(value) as T
  } catch {
    console.warn("Failed to parse JSON:", value)
    return undefined
  }
}
