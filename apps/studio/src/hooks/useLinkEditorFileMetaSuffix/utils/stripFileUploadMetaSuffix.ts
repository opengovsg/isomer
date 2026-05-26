import { toDisplayType } from "./toDisplayType"

/**
 * Checks whether `value` is a known file type label from `toDisplayType`, e.g.
 * `"PDF"`, `"XLSX"`, `"DOCX"` (uppercase extension of an allowed upload type).
 */
function isDisplayType(value: string): boolean {
  return toDisplayType(`.${value.toLowerCase()}`) !== undefined
}

/**
 * Checks whether `value` is a file size from `formatBytes`: a non-negative number,
 * one space, then B/KB/MB/GB/TB — e.g. `"280.00 KB"`, `"1.00 MB"`, `"100.00 B"`.
 */
function isFormattedSize(value: string): boolean {
  const parts = value.split(" ")
  if (parts.length !== 2) return false

  const [num, unit] = parts
  if (!num || !unit) return false // defensive programming

  return ["B", "KB", "MB", "GB", "TB"].includes(unit) && Number(num) >= 0
}

/**
 * Checks whether bracket content matches an auto-generated upload suffix from
 * `buildFileUploadMetaSuffix`: `[type]`, `[size]`, or `[type, size]` — e.g.
 * `"PDF"`, `"100.00 B"`, or `"PDF, 1.00 MB"`.
 */
function isFileUploadMetaSuffix(content: string): boolean {
  const parts = content.split(", ")

  // Single segment: type only (e.g. "PDF") or size only (e.g. "280.00 KB").
  if (parts.length === 1) {
    const part = parts[0]
    if (!part) return false // defensive programming
    return isDisplayType(part) || isFormattedSize(part)
  }

  // Two segments: type then size (e.g. "PDF, 1.00 MB").
  if (parts.length === 2) {
    const [type, size] = parts
    if (!type || !size) return false // defensive programming
    return isDisplayType(type) && isFormattedSize(size)
  }

  return false
}

/**
 * Removes a trailing auto-generated `[type]` / `[type, size]` / `[size]` suffix
 * from link text so re-uploading a file does not stack duplicates.
 */
export function stripFileUploadMetaSuffix(text: string): string {
  // Opening delimiter of the upload meta suffix from `buildFileUploadMetaSuffix`.
  const META_SUFFIX_OPEN = " ["

  // Closing delimiter of the upload meta suffix from `buildFileUploadMetaSuffix`.
  const META_SUFFIX_CLOSE = "]"

  // Find the opening bracket index
  // If not found, return the original text
  const openBracketIndex = text.lastIndexOf(META_SUFFIX_OPEN)
  if (openBracketIndex === -1) return text

  // If the closing bracket is not found, return the original text
  if (!text.endsWith(META_SUFFIX_CLOSE)) return text

  // Extract the bracket content
  const contentStart = openBracketIndex + META_SUFFIX_OPEN.length
  const contentEnd = text.length - META_SUFFIX_CLOSE.length
  const bracketContent = text.slice(contentStart, contentEnd)

  // If the bracket content is not a valid file upload meta suffix, return the original text
  if (!isFileUploadMetaSuffix(bracketContent)) return text

  // Return the text up to the opening bracket
  return text.slice(0, openBracketIndex)
}
