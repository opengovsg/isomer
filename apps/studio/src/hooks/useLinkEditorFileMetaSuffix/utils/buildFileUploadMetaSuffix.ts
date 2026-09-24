import { formatBytes } from "@opengovsg/isomer-components"
import { getFileExtension } from "~/utils/getFileExtension"

import { toDisplayType } from "./toDisplayType"

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
