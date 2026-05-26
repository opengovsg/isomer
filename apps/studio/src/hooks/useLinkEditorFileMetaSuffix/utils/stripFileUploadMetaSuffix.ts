import { toDisplayType } from "./toDisplayType"

const FORMATTED_SIZE_UNITS = new Set(["B", "KB", "MB", "GB", "TB"])

function isDisplayType(value: string): boolean {
  return toDisplayType(`.${value.toLowerCase()}`) !== undefined
}

function isFormattedSize(value: string): boolean {
  const unitSep = value.lastIndexOf(" ")
  if (unitSep === -1) return false

  const unit = value.slice(unitSep + 1)
  if (!FORMATTED_SIZE_UNITS.has(unit)) return false

  const num = Number(value.slice(0, unitSep))
  return Number.isFinite(num) && num >= 0
}

function isFileUploadMetaSuffix(content: string): boolean {
  const parts = content.split(", ")

  if (parts.length === 1) {
    const part = parts[0]
    if (!part) return false // defensive programming
    return isDisplayType(part) || isFormattedSize(part)
  }

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
  const bracketStart = text.lastIndexOf(" [")
  if (bracketStart === -1 || !text.endsWith("]")) return text

  const content = text.slice(bracketStart + 2, -1)
  if (!isFileUploadMetaSuffix(content)) return text

  return text.slice(0, bracketStart)
}
