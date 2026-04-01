import { formatBytes } from "@opengovsg/isomer-components"

import { FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING } from "../features/editing-experience/components/form-builder/renderers/controls/constants"

// `.pdf` → `PDF`.
const EXTENSION_TO_DISPLAY_SUFFIX: Record<string, string> = Object.fromEntries(
  Object.keys(FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING).map((ext) => [
    ext,
    ext.replace(/^\./, "").toUpperCase(),
  ]),
)

const DISPLAY_TYPE_SUFFIX = Object.values(EXTENSION_TO_DISPLAY_SUFFIX)
  .sort((a, b) => b.length - a.length)
  .join("|")

const FORMATTED_SIZE = String.raw`[\d.]+\s+(?:B|KB|MB|GB|TB)`

/**
 * Removes a trailing auto-generated `[type]` / `[type, size]` / `[size]` suffix
 * from link text so re-uploading a file does not stack duplicates.
 */
const FILE_UPLOAD_META_SUFFIX_RE = new RegExp(
  String.raw`(?:\s\[(?:${DISPLAY_TYPE_SUFFIX})(?:, ${FORMATTED_SIZE})?\]|\s\[${FORMATTED_SIZE}\])$`,
  "i",
)

function getLowercaseExtension(fileName: string): string {
  const lower = fileName.toLowerCase()
  const dot = lower.lastIndexOf(".")
  if (dot === -1) return ""
  return lower.slice(dot)
}

export function getFileExtensionType(fileName: string): string | undefined {
  const ext = getLowercaseExtension(fileName)
  return EXTENSION_TO_DISPLAY_SUFFIX[ext]
}

/**
 * Builds the bracket suffix appended to link text after a successful file upload
 * in the prose link editor, e.g. ` [PDF, 1.00 MB]`.
 * Omits the type or size segment when unavailable (per product handling).
 */
export function buildFileUploadMetaSuffix(file: File): string {
  const type = getFileExtensionType(file.name)
  const size = formatBytes(file.size)

  const parts: string[] = []
  if (type) parts.push(type)
  if (size) parts.push(size)

  if (parts.length === 0) return ""
  return ` [${parts.join(", ")}]`
}

export function stripFileUploadMetaSuffix(text: string): string {
  return text.replace(FILE_UPLOAD_META_SUFFIX_RE, "")
}
