export const formatBytes = (bytes: number): string => {
  // Handle edge cases
  if (bytes <= 0) return "0 B"

  const units = ["B", "KB", "MB", "GB", "TB"]
  const index = Math.floor(Math.log(bytes) / Math.log(1024))

  // Ensure index is within bounds
  const safeIndex = Math.min(Math.max(0, index), units.length - 1)

  const value = bytes / Math.pow(1024, safeIndex)
  return value.toFixed(2) + " " + units[safeIndex]
}
