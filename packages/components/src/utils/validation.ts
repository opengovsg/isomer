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
  if (urlObject.hostname === "www.onemap.gov.sg") {
    return (
      urlObject.pathname === "/minimap/minimap.html" ||
      urlObject.pathname === "/amm/amm.html"
    )
  }

  if (urlObject.hostname === "mobile.onemap.gov.sg") {
    return urlObject.pathname.length > 1
  }

  return false
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
  googlemaps: "^https://www\\.google\\.com/maps(?:/d)?/embed(?:\\?.*)?$",
  onemap:
    "^https://www\\.onemap\\.gov\\.sg(/minimap/minimap\\.html|/amm/amm\\.html).*$|^https://mobile\\.onemap\\.gov\\.sg/.+$",
  ogpmaps: `^https://maps\\.gov\\.sg/.*$`,
} as const

export const MAPS_EMBED_URL_PATTERN = Object.values(MAPS_EMBED_URL_REGEXES)
  .map((re) => `(${re})`)
  .join("|")

// Validation for video-related embed URLs
export const YOUTUBE_PRIVACY_ENHANCED_DOMAINS = [
  "www.youtube-nocookie.com",
  "youtube-nocookie.com",
] as const

export const YOUTUBE_PRIVACY_ENHANCED_HOST = YOUTUBE_PRIVACY_ENHANCED_DOMAINS[0]

export const isYoutubePrivacyEnhancedHost = (hostname: string): boolean =>
  YOUTUBE_PRIVACY_ENHANCED_DOMAINS.some((h) => h === hostname)

export const VALID_VIDEO_DOMAINS = {
  youtube: [
    "www.youtube.com",
    "youtube.com",
    ...YOUTUBE_PRIVACY_ENHANCED_DOMAINS,
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
  fbvideo: "^https://www\\.facebook\\.com/plugins/video\\.php(?:\\?.*)?$",
  vimeo: "^https://player\\.vimeo\\.com/video/.*$",
  youtube:
    "^https://www\\.(youtube|youtube-nocookie)\\.com/(embed/|watch\\?v=).*$",
} as const

export const VIDEO_EMBED_URL_PATTERN = Object.values(VIDEO_EMBED_URL_REGEXES)
  .map((re) => `(${re})`)
  .join("|")

// Validation for audio embed URLs (Spotify or Apple Podcast) for the "audio" component
// Only these variants are supported: Spotify episode, show, or playlist; Apple Podcast show or episode
const VALID_AUDIO_EMBED_DOMAINS = {
  spotify: "open.spotify.com",
  applepodcast: "embed.podcasts.apple.com",
}

export const AUDIO_EMBED_URL_REGEXES = {
  spotify:
    "^https://open\\.spotify\\.com/embed/(episode|show|playlist)/[a-zA-Z0-9]+.*$",
  applepodcast: "^https://embed\\.podcasts\\.apple\\.com/[a-z]{2}/[a-z-]+/.*$",
} as const

export const AUDIO_EMBED_URL_PATTERN = Object.values(AUDIO_EMBED_URL_REGEXES)
  .map((re) => `(${re})`)
  .join("|")

export const isValidAudioEmbedUrl = (url: string) => {
  if (!url) {
    return false
  }

  try {
    const urlObject = new URL(url)
    const allValidAudioEmbedDomains = Object.values(
      VALID_AUDIO_EMBED_DOMAINS,
    ).flat()
    return (
      allValidAudioEmbedDomains.includes(urlObject.hostname) &&
      new RegExp(AUDIO_EMBED_URL_PATTERN).test(url)
    )
  } catch (_) {
    return false
  }
}

export const isApplePodcastUrl = (url: string) => {
  try {
    return new URL(url).hostname === VALID_AUDIO_EMBED_DOMAINS.applepodcast
  } catch {
    return false
  }
}

// ✅ "hello"
// ✅ " hello " (has non-whitespace in the middle)
// ✅ " a " (one letter surrounded by spaces)
// ❌ "" (empty string)
// ❌ " " (only whitespace)
export const NON_EMPTY_STRING_REGEX = "^(?=.*\\S)"

// Stricter variant: rejects leading/trailing whitespace in addition to empty/whitespace-only.
// ✅ "hello"
// ✅ "a"
// ✅ "ab cd" (internal whitespace allowed)
// ❌ "" (empty string)
// ❌ " " (only whitespace)
// ❌ " hello" (leading whitespace)
// ❌ "hello " (trailing whitespace)
// ❌ " a " (surrounded by spaces)
export const TRIMMED_NON_EMPTY_STRING_REGEX = "^\\S(.*\\S)?$"

// ✅ "d_a" (minimum 3 characters, starts with "d_")
// ✅ "d_abc" (more than 3 characters, starts with "d_")
// ❌ "d_" (only 2 characters)
// ❌ "a_bc" (doesn't start with "d_")
// ❌ "d" (only 1 character)
// ❌ "d_ab c" (contains space)
// ❌ "d_ab_c" (contains underscore after prefix)
export const DGS_ID_STRING_REGEX = "^d_[a-zA-Z0-9]+$"

// An AskGov agency ID is the first path segment of an ask.gov.sg link — `mha` in
// https://ask.gov.sg/mha/questions/123 — and that bare ID is what the widget
// script expects. Agencies routinely paste the whole link instead, so the field
// accepts either form and `getAskgovIdFromString` normalises a link down to the
// ID. The scheme and host spell their casing out as character classes rather
// than using the `i` flag: this pattern is also used as a JSON schema `pattern`,
// which ajv compiles with the `u` flag only, and the schema and the extractor
// have to accept exactly the same inputs.
const ASKGOV_SCHEME_REGEX = "(?:[Hh][Tt][Tt][Pp][Ss]?://)?"
const ASKGOV_HOST_REGEX =
  "(?:[Ww][Ww][Ww]\\.)?[Aa][Ss][Kk]\\.[Gg][Oo][Vv]\\.[Ss][Gg]"

// ✅ "mha"
// ✅ "help2"
// ❌ "custom/agency" (an ID has no path separators)
// ❌ "ask.gov.sg" (an ID has no dots)
// ❌ "" (empty string)
export const ASKGOV_AGENCY_ID_REGEX = "[A-Za-z0-9_-]+"

// Captures the agency ID. Whatever follows it — further path segments, a query
// string or a fragment — is ignored, so links to a specific question or topic
// resolve to the same agency ID.
// ✅ "https://ask.gov.sg/mha"
// ✅ "http://www.ask.gov.sg/help/questions/question-id?from=widget"
// ✅ "ask.gov.sg/mha" (scheme is optional)
// ✅ "HTTPS://WWW.ASK.GOV.SG/mha" (scheme and host are case-insensitive)
// ❌ "https://ask.gov.sg/" (no agency ID)
// ❌ "https://staging.ask.gov.sg/mha" (only ask.gov.sg and www.ask.gov.sg)
// ❌ "example.com/mha" (not an AskGov host)
// ❌ "ftp://ask.gov.sg/mha" (only HTTP(S))
export const ASKGOV_URL_REGEX = `${ASKGOV_SCHEME_REGEX}${ASKGOV_HOST_REGEX}/(${ASKGOV_AGENCY_ID_REGEX})(?:[/?#].*)?`

// Either of the two above. Surrounding whitespace is tolerated so that a value
// pasted with a stray space is not rejected outright; `getAskgovIdFromString`
// trims it off before the ID is stored.
export const ASKGOV_ID_OR_URL_REGEX = `^\\s*(?:${ASKGOV_AGENCY_ID_REGEX}|${ASKGOV_URL_REGEX})\\s*$`

// Matches Google tag IDs across the formats observed in the wild:
//   GTM-XXXXXX  — Google Tag Manager containers (official)
//   G-XXXXXX    — Google Analytics 4 measurement IDs (officially loaded via gtag.js, not GTM,
//                 but users paste them into the GTM field and they work in practice)
//   GT-XXXXXX   — Google Tag IDs (observed working in manual testing; not documented by Google)
// All three share the same GTM snippet format at runtime, so we accept them all even though
// only GTM- is officially documented.
// Examples:
// ✅ "GTM-ABC123"
// ✅ "G-ABC123"
// ✅ "GT-ABC123"
// ❌ "gtm-abc123" (lowercase)
// ❌ "GTM-" (missing container ID)
// ❌ "');alert(document.cookie);//" (XSS payload)
// NOTE: Official documentation does not specify allowed length,
// so we use ^GTM-[A-Z0-9]+$ (one or more chars) for future proofing.
export const GTM_ID_STRING_REGEX = "^(GTM|G|GT)-[A-Z0-9]+$"

// Blocks "fancy text generator" lookalike characters (e.g. "𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥") while
// leaving all other languages, emoji, and punctuation untouched. Ranges are
// expressed as UTF-16 (surrogate pairs for the two astral-plane blocks) so
// this works as a plain `new RegExp(...)` without needing the `u` flag.
// Blocked:
//   - Mathematical Alphanumeric Symbols (bold/italic/script/fraktur/double-struck/
//     sans-serif/monospace letters & digits), e.g. 𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥, 𝓕𝓪𝓷𝓬𝔂
//   - Enclosed Alphanumerics (circled/parenthesized), e.g. ⓐⓑⓒ, ①②③, Ⓒ
//   - Enclosed Alphanumeric Supplement letters (squared/negative-circled),
//     e.g. 🄰🄱🄲, 🅐🅑🅒 — deliberately stops short of Regional Indicator
//     Symbols (U+1F1E6-U+1F1FF), which are what flag emoji (e.g. 🇸🇬) are built from
//   - Fullwidth Latin letters/digits only, e.g. Ａｂｃ１２３ — NOT the rest of the
//     Halfwidth/Fullwidth Forms block, which also contains fullwidth CJK
//     punctuation (，。！？) used legitimately in Chinese/Japanese text
//   - Letterlike Symbols that are script/black-letter/double-struck stand-ins
//     for Latin letters (the pre-Unicode-3.2 letters that predate the
//     Mathematical Alphanumeric Symbols block above), e.g. ℂℍℕℝℤ, ℬℰℱℋℐℒℳℛℯℊℴ —
//     deliberately excludes the rest of the Letterlike Symbols block (U+2100-U+214F),
//     which is legitimate symbols like ℃℉№℠℡™Åℓ℮Ωℹ, not letter substitutes
// ✅ "Official Unveiling"
// ✅ "海报" / "Selamat datang" / "வணக்கம்" / "🇸🇬🎉"
// ✅ "© 2026 Government of Singapore ® ™" / "25℃" / "No. 1 → №1"
// ❌ "𝐎𝐟𝐟𝐢𝐜𝐢𝐚𝐥 𝐔𝐧𝐯𝐞𝐢𝐥𝐢𝐧𝐠"
// ❌ "Ⓒⓞⓟⓨ" / "🅁🄴🅂🄴🅁🅅🄴🄳" / "Ａｄｍｉｎ" / "ℂℍℕℝℤ"
// Consumed by `IsomerString` (src/interfaces/IsomerString.ts). Kept here as a
// plain string, with no `@sinclair/typebox` dependency, so client-rendered
// template components that only need runtime validators from this file
// (e.g. `isValidVideoUrl`) don't transitively pull in typebox for treeshaking.
export const NO_STYLIZED_UNICODE_REGEX =
  "^(?![\\s\\S]*(?:\\uD835[\\uDC00-\\uDFFF]|[\\u2460-\\u24FF]|\\uD83C[\\uDD10-\\uDD89]|[\\uFF10-\\uFF19\\uFF21-\\uFF3A\\uFF41-\\uFF5A]|[\\u2102\\u210A-\\u210E\\u2110-\\u2112\\u2115\\u2119-\\u211D\\u2124\\u2128\\u212C\\u212D\\u212F-\\u2134\\u2141-\\u2144\\u2145-\\u2149\\u214E]))"
