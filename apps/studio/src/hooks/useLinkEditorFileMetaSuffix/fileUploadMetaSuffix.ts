import { formatBytes } from "@opengovsg/isomer-components"
import { FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING } from "~/features/editing-experience/components/form-builder/renderers/controls/constants"
import { getFileExtension } from "~/utils/getFileExtension"

const EXTENSION_TO_DISPLAY_TYPE = Object.fromEntries(
  Object.keys(FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING).map((ext) => [
    ext,
    // Remove leading dot and convert to uppercase for display (e.g. ".pdf" -> "PDF")
    ext.startsWith(".") ? ext.slice(1).toUpperCase() : ext.toUpperCase(),
  ]),
)

const FILE_UPLOAD_DISPLAY_TYPES = new Set(
  Object.values(EXTENSION_TO_DISPLAY_TYPE),
)

const FORMATTED_SIZE_UNITS = new Set(["B", "KB", "MB", "GB", "TB"])

function toDisplayType(ext: string): string | undefined {
  return EXTENSION_TO_DISPLAY_TYPE[ext]
}

function isDisplayType(value: string): boolean {
  return FILE_UPLOAD_DISPLAY_TYPES.has(value.toUpperCase())
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
 * Builds the bracket suffix appended to link text after a successful file upload
 * in the prose link editor, e.g. ` [PDF, 1.00 MB]`.
 * Omits the type or size segment when unavailable (per product handling).
 */
export function buildFileUploadMetaSuffix(file: File): string {
  const ext = getFileExtension(file.name)
  const type = toDisplayType(ext)
  const size = formatBytes(file.size)

  const parts: string[] = []
  if (type) parts.push(type)
  if (size) parts.push(size)

  if (parts.length === 0) return ""
  return ` [${parts.join(", ")}]`
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
