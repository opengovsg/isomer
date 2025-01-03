export const MAX_IMG_FILE_SIZE_BYTES = 5000000
export const IMAGE_UPLOAD_ACCEPTED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/svg+xml",
  "image/tiff",
  "image/bmp",
  "image/webp",
]
export const MAX_FILE_SIZE_BYTES = 20000000
export const FILE_UPLOAD_ACCEPTED_MIME_TYPE_MAPPING: Record<string, string> = {
  ".pdf": "application/pdf",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".csv": "text/csv",
  ".tsv": "text/tab-separated-values",
}
