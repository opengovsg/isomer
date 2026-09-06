export const IMAGE_ACCEPTED_MIME_TYPE_MAPPING = {
  ".avif": "image/avif",
  ".bmp": "image/bmp",
  ".gif": "image/gif",
  ".jpeg": "image/jpeg",
  // same MIME type as .jpeg
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
} as const satisfies Record<string, string>

/** Subset of {@link IMAGE_ACCEPTED_MIME_TYPE_MAPPING};
 * key order is used for UI lists in Studio (.png and .svg first).
 * .jpg, .jpeg, and .webp are also accepted. */
export const FAVICON_ACCEPTED_MIME_TYPE_MAPPING = {
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
} as const satisfies Record<string, string>
