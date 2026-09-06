export const IMAGE_ACCEPTED_MIME_TYPE_MAPPING = {
  ".jpg": "image/jpeg", // same MIME type as .jpeg
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".bmp": "image/bmp",
  ".webp": "image/webp",
  ".avif": "image/avif",
} as const satisfies Record<string, string>

/** Subset of {@link IMAGE_ACCEPTED_MIME_TYPE_MAPPING};
 * key order is used for UI lists in Studio (.png and .svg first).
 * .jpg, .jpeg, and .webp are also accepted. */
export const FAVICON_ACCEPTED_MIME_TYPE_MAPPING = {
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
} as const satisfies Record<string, string>
