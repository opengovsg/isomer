export const formatBytes = (bytes: number): string | undefined => {
  // Handle edge cases
  if (bytes <= 0 || isNaN(bytes)) return undefined

  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.floor(Math.log(bytes) / Math.log(1024))

  // Ensure index is within bounds
  const safeIndex = Math.min(Math.max(0, index), units.length - 1)

  const value = bytes / Math.pow(1024, safeIndex)
  return value.toFixed(2) + " " + units[safeIndex]
}
