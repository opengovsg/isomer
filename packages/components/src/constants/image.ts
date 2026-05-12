export const IMAGE_ACCEPTED_MIME_TYPE_MAPPING: Record<string, string> = {
  ".jpg": "image/jpeg", // same MIME type as .jpeg
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".tiff": "image/tiff",
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
