const ALLOWED_URL_REGEXES = {
  external: "^https:\\/\\/",
  phone: "^tel:",
  sms: "^sms:",
  mail: "^mailto:",
  internal: "^\\[resource:(\\d+):(\\d+)\\]$",
  // NOTE: This is taken with reference from `convertAssetLinks`
  // and should remain in sync.
  // Unfortunately, typebox requires a string and hence, doubly escaped characters
  // but `re.source` only gives us the actual string
  // regex for asset links: /^\/(\d+)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
  files:
    "^\\/(\\d+)\\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\/",
  // These are the standard internal links that are used by sites on GitHub.
  // We can drop them once all sites have fully migrated to Studio.
  legacy: "^\\/",
} as const

export const LINK_HREF_PATTERN =
  `(${ALLOWED_URL_REGEXES.external})|(${ALLOWED_URL_REGEXES.phone})|(${ALLOWED_URL_REGEXES.sms})|(${ALLOWED_URL_REGEXES.mail})|(${ALLOWED_URL_REGEXES.internal})|(${ALLOWED_URL_REGEXES.files})|(${ALLOWED_URL_REGEXES.legacy})` as const
export const REF_HREF_PATTERN =
  `(${ALLOWED_URL_REGEXES.external})|(${ALLOWED_URL_REGEXES.internal})|(${ALLOWED_URL_REGEXES.files})|(${ALLOWED_URL_REGEXES.legacy})` as const
export const REF_INTERNAL_HREF_PATTERN =
  `(${ALLOWED_URL_REGEXES.internal})|(${ALLOWED_URL_REGEXES.legacy})` as const

// Validation for form-related embed URLs
export const isValidFormSGEmbedUrl = (url: string) => {
  if (!url) {
    return false
  }

  try {
    const urlObject = new URL(url)
    return urlObject.hostname === "form.gov.sg"
  } catch (_) {
    return false
  }
}

export const FORMSG_EMBED_URL_REGEXES = {
  formsg: "^https://form\\.gov\\.sg/[a-z0-9]*$",
} as const

export const FORMSG_EMBED_URL_PATTERN = Object.values(FORMSG_EMBED_URL_REGEXES)
  .map((re) => `(${re})`)
  .join("|")

// Validation for map-related embed URLs
const isValidGoogleMapsEmbedUrl = (urlObject: URL) => {
  return (
    urlObject.hostname === "www.google.com" &&
    (urlObject.pathname === "/maps/embed" ||
      urlObject.pathname === "/maps/d/embed")
  )
}

const isValidOneMapEmbedUrl = (urlObject: URL) => {
  return (
    urlObject.hostname === "www.onemap.gov.sg" &&
    (urlObject.pathname === "/minimap/minimap.html" ||
      urlObject.pathname === "/amm/amm.html")
  )
}

export const isValidOGPMapsEmbedUrl = (urlObject: URL) => {
  return (
    urlObject.hostname === "maps.gov.sg" && urlObject.pathname.startsWith("/")
  )
}

export const isValidMapEmbedUrl = (url: string) => {
  if (!url) {
    return false
  }

  try {
    const urlObject = new URL(url)

    return (
      (isValidGoogleMapsEmbedUrl(urlObject) ||
        isValidOneMapEmbedUrl(urlObject) ||
        isValidOGPMapsEmbedUrl(urlObject)) &&
      new RegExp(MAPS_EMBED_URL_PATTERN).test(url)
    )
  } catch (_) {
    return false
  }
}

// NOTE: This validation is still needed as this is the only validation method
// that is supported inside the JSON schema. Components rely on the URL object
// validation for better security.
export const MAPS_EMBED_URL_REGEXES = {
  googlemaps: "^https://www\\.google\\.com/maps(?:/d)?/embed?.*$",
  onemap:
    "^https://www\\.onemap\\.gov\\.sg(/minimap/minimap\\.html|/amm/amm\\.html).*$",
  ogpmaps: `^https://maps\\.gov\\.sg/.*$`,
} as const

export const MAPS_EMBED_URL_PATTERN = Object.values(MAPS_EMBED_URL_REGEXES)
  .map((re) => `(${re})`)
  .join("|")

// Validation for video-related embed URLs
export const VALID_VIDEO_DOMAINS = {
  youtube: [
    "www.youtube.com",
    "www.youtube-nocookie.com",
    "youtube.com",
    "youtube-nocookie.com",
  ],
  vimeo: ["player.vimeo.com"],
  fbvideo: ["www.facebook.com"],
}

export const isValidVideoUrl = (url: string) => {
  if (!url) {
    return false
  }

  try {
    const urlObject = new URL(url)
    const allValidVideoDomains = Object.values(VALID_VIDEO_DOMAINS).flat()

    return (
      allValidVideoDomains.includes(urlObject.hostname) &&
      new RegExp(VIDEO_EMBED_URL_PATTERN).test(url)
    )
  } catch (_) {
    return false
  }
}

// NOTE: This validation is still needed as this is the only validation method
// that is supported inside the JSON schema. Components rely on the URL object
// validation for better security.
export const VIDEO_EMBED_URL_REGEXES = {
  fbvideo: "^https://www\\.facebook\\.com/plugins/video.php?.*$",
  vimeo: "^https://player\\.vimeo\\.com/video/.*$",
  youtube:
    "^https://www\\.(youtube|youtube-nocookie)\\.com/(embed/|watch\\?v=).*$",
} as const

export const VIDEO_EMBED_URL_PATTERN = Object.values(VIDEO_EMBED_URL_REGEXES)
  .map((re) => `(${re})`)
  .join("|")

// ✅ "hello"
// ✅ " hello " (has non-whitespace in the middle)
// ✅ " a " (one letter surrounded by spaces)
// ❌ "" (empty string)
// ❌ " " (only whitespace)
export const NON_EMPTY_STRING_REGEX = "^(?=.*\\S)"
