import { VALID_VIDEO_DOMAINS } from "~/utils/validation"

const YOUTUBE_PRIVACY_ENHANCED_HOST = "www.youtube-nocookie.com"
const YOUTUBE_SDDEFAULT_IMAGE_NAME = "sddefault.jpg"
const YOUTUBE_HQDEFAULT_IMAGE_NAME = "hqdefault.jpg"
const YOUTUBE_MISSING_THUMBNAIL_WIDTH = 120
const YOUTUBE_MISSING_THUMBNAIL_HEIGHT = 90

/**
 * Rewrites a YouTube URL to the privacy-enhanced embed form (youtube-nocookie.com).
 * Converts /watch?v=id to /embed/id. Returns undefined for unsupported path shapes.
 */
export const getPrivacyEnhancedYouTubeEmbedUrl = (
  urlObject: URL,
): string | undefined => {
  const isYouTube = VALID_VIDEO_DOMAINS.youtube.includes(urlObject.hostname)
  const isAlreadyPrivacyEnhanced =
    urlObject.hostname === "www.youtube-nocookie.com" ||
    urlObject.hostname === "youtube-nocookie.com"
  if (isYouTube && !isAlreadyPrivacyEnhanced) {
    urlObject.hostname = YOUTUBE_PRIVACY_ENHANCED_HOST
  }

  const { pathname, searchParams } = urlObject

  if (pathname.startsWith("/embed/")) {
    return urlObject.toString()
  }
  if (pathname.startsWith("/watch")) {
    const videoId = searchParams.get("v")
    if (!videoId) return ""
    urlObject.pathname = `/embed/${videoId}`
    urlObject.search = ""
    return urlObject.toString()
  }
  return undefined
}

/**
 * Extracts YouTube video ID from a valid YouTube URL.
 * Returns null for non-YouTube URLs or when the ID cannot be parsed.
 */
export const getYouTubeVideoId = (url: string): string | null => {
  try {
    const urlObject = new URL(url)
    if (!VALID_VIDEO_DOMAINS.youtube.includes(urlObject.hostname)) {
      return null
    }
    const { pathname, searchParams } = urlObject
    if (pathname.startsWith("/embed/")) {
      const id = pathname.slice("/embed/".length).split("?")[0]
      // "videoseries" is a playlist embed path, not a video ID
      if (!id || id === "videoseries") return null
      return id
    }
    if (pathname.startsWith("/watch")) {
      return searchParams.get("v") || null
    }
    return null
  } catch {
    return null
  }
}

// NOTE: We are setting a do-not-track attribute on Vimeo embeds
// Ref: https://developer.vimeo.com/api/oembed/videos
export const getPrivacyEnhancedVimeoEmbedUrl = (url: string): string => {
  const urlObject = new URL(url)
  urlObject.searchParams.set("dnt", "true")
  return urlObject.toString()
}

/**
 * Extracts Vimeo video ID from a valid Vimeo embed URL.
 * Returns null for non-Vimeo URLs or when the ID cannot be parsed.
 * Expected URL format: https://player.vimeo.com/video/{videoId}
 */
export const getVimeoVideoId = (url: string): string | null => {
  try {
    const urlObject = new URL(url)
    if (!VALID_VIDEO_DOMAINS.vimeo.includes(urlObject.hostname)) {
      return null
    }
    const { pathname } = urlObject
    if (pathname.startsWith("/video/")) {
      const id = pathname.slice("/video/".length).split(/[?/]/)[0]
      return id || null
    }
    return null
  } catch {
    return null
  }
}

export const getPreferredYouTubeThumbnailUrl = (url: string): string => {
  return url.replace(YOUTUBE_HQDEFAULT_IMAGE_NAME, YOUTUBE_SDDEFAULT_IMAGE_NAME)
}

export const shouldFallbackToHqYouTubeThumbnail = ({
  src,
  naturalWidth,
  naturalHeight,
}: {
  src: string
  naturalWidth: number
  naturalHeight: number
}): boolean => {
  return (
    src.endsWith(`/${YOUTUBE_SDDEFAULT_IMAGE_NAME}`) &&
    naturalWidth === YOUTUBE_MISSING_THUMBNAIL_WIDTH &&
    naturalHeight === YOUTUBE_MISSING_THUMBNAIL_HEIGHT
  )
}

export const getHqYouTubeThumbnailUrl = (url: string): string => {
  return url.replace(YOUTUBE_SDDEFAULT_IMAGE_NAME, YOUTUBE_HQDEFAULT_IMAGE_NAME)
}
