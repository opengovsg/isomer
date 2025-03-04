export const MAX_IMG_FILE_SIZE_BYTES = 5000000
export const IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING: Record<string, string> = {
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".tiff": "image/tiff",
  ".bmp": "image/bmp",
  ".webp": "image/webp",
}

export const ACCEPTED_IMAGE_TYPES_MESSAGE = Object.keys(
  IMAGE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
).join(", ")

export const MAX_FILE_SIZE_BYTES = 20000000
export const FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING: Record<string, string> = {
  ".pdf": "application/pdf",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv",
  ".tsv": "text/tab-separated-values",
}

export const ACCEPTED_FILE_TYPES_MESSAGE = Object.keys(
  FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING,
).join(", ")

export const ONE_MB_IN_BYTES = 1000000
