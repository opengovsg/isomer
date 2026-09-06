export const ONE_MB_IN_BYTES = 1000000

export const MAX_IMG_FILE_SIZE_BYTES = 5 * ONE_MB_IN_BYTES
// Lower than MAX_IMG_FILE_SIZE_BYTES: SVGs are sanitized server-side (CPU/memory cost per request)
export const MAX_SVG_FILE_SIZE_BYTES = 1 * ONE_MB_IN_BYTES

export const MAX_FILE_SIZE_BYTES = 50 * ONE_MB_IN_BYTES
export const FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING = {
  ".pdf": "application/pdf",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv",
  ".tsv": "text/tab-separated-values",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
} satisfies Record<
  ".pdf" | ".xls" | ".xlsx" | ".csv" | ".tsv" | ".doc" | ".docx",
  string
>

export const RISKY_FILE_EXTENSIONS = new Set<
  keyof typeof FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING
>([".doc", ".docx", ".xls", ".xlsx"])

export type RiskyFileExtension = ".doc" | ".docx" | ".xls" | ".xlsx"

export const isRiskyFileExtension = (
  ext: string,
): ext is RiskyFileExtension => {
  switch (ext) {
    case ".doc":
    case ".docx":
    case ".xls":
    case ".xlsx":
      return true
    default:
      return false
  }
}
