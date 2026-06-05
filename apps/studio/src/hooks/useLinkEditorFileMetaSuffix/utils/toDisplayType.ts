import { FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING } from "~/features/editing-experience/components/form-builder/renderers/controls/constants"

/**
 * Converts a file extension to a display type.
 * @param ext - The file extension to convert.
 * @returns The display type, or undefined if the extension is not in the allowed list.
 */
export function toDisplayType(ext: string): string | undefined {
  return ext in FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING
    ? ext.slice(1).toUpperCase()
    : undefined
}
