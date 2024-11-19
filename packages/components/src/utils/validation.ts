export const ALLOWED_URL_REGEXES = {
  external: "^https:\\/\\/",
  mail: "^mailto:",
  internal: "^\\[resource:(\\d+):(\\d+)\\]$",
  // NOTE: This is taken with reference from `convertAssetLinks`
  // and should remain in sync.
  // Unfortunately, typebox requires a string and hence, doubly escaped characters
  // but `re.source` only gives us the actual string
  // regex for asset links: /^\/(\d+)\//
  files: "^\\/(\\d+)\\/",
  // These are the standard internal links that are used by sites on GitHub.
  // We can drop them once all sites have fully migrated to Studio.
  legacy: "^\\/",
} as const

export const LINK_HREF_PATTERN =
  `(${ALLOWED_URL_REGEXES.external})|(${ALLOWED_URL_REGEXES.mail})|(${ALLOWED_URL_REGEXES.internal})|(${ALLOWED_URL_REGEXES.files})|(${ALLOWED_URL_REGEXES.legacy})` as const
export const REF_HREF_PATTERN =
  `(${ALLOWED_URL_REGEXES.external})|(${ALLOWED_URL_REGEXES.internal})|(${ALLOWED_URL_REGEXES.files})|(${ALLOWED_URL_REGEXES.legacy})` as const

const EXTERNAL_EMBED_URL_REGEXES = {
  googlemaps: "^https://www\\.google\\.com/maps/embed?.*$",
  onemap: "^https://www\\.onemap\\.gov\\.sg/minimap/minimap\\.html.*$",
  fbvideo: "^https://www\\.facebook\\.com/plugins/video.php?.*$",
  vimeo: "^https://player\\.vimeo\\.com/video/.*$",
  youtube:
    "^https://www\\.(youtube|youtube-nocookie)\\.com/(embed/|watch\\?v=).*$",
}

export const MAPS_EMBED_URL_PATTERN = [
  EXTERNAL_EMBED_URL_REGEXES.googlemaps,
  EXTERNAL_EMBED_URL_REGEXES.onemap,
]
  .map((re) => `(${re})`)
  .join("|")

export const VIDEO_EMBED_URL_PATTERN = [
  EXTERNAL_EMBED_URL_REGEXES.fbvideo,
  EXTERNAL_EMBED_URL_REGEXES.vimeo,
  EXTERNAL_EMBED_URL_REGEXES.youtube,
]
  .map((re) => `(${re})`)
  .join("|")
