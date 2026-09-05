export const IMAGE_ACCEPTED_MIME_TYPE_MAPPING: Record<string, string> = {
  ".jpg": "image/jpeg", // same MIME type as .jpeg
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".webp": "image/webp",
  ".avif": "image/avif",
}

/** Subset of {@link IMAGE_ACCEPTED_MIME_TYPE_MAPPING};
 * key order is used for UI lists in Studio (.png and .svg first).
 * .jpg, .jpeg, and .webp are also accepted. */
export const FAVICON_ACCEPTED_MIME_TYPE_MAPPING: Record<string, string> = {
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
}

// NOTE: Taken from `isomer-next-infra`:
// this is the list of content types that we can
// optimise the image for
export const CONTENT_TYPE_TO_FORMAT = {
  "image/jpeg": "jpeg",
  "image/jpg": "jpeg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/tiff": "tiff",
} as const

export const SUPPORTED_OPTIMIZABLE_FORMATS = Object.values(
  CONTENT_TYPE_TO_FORMAT,
)
