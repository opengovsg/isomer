import {
  isYoutubePrivacyEnhancedHost,
  VALID_VIDEO_DOMAINS,
  YOUTUBE_PRIVACY_ENHANCED_HOST,
} from "~/utils/validation"

/**
 * Rewrites a YouTube URL to the privacy-enhanced embed form (youtube-nocookie.com).
 * Converts /watch?v=id to /embed/id. Returns undefined for unsupported path shapes.
 */
export const getPrivacyEnhancedYouTubeEmbedUrl = (
  urlObject: URL,
): string | undefined => {
  const isYouTube = VALID_VIDEO_DOMAINS.youtube.includes(urlObject.hostname)
  const isAlreadyPrivacyEnhanced = isYoutubePrivacyEnhancedHost(
    urlObject.hostname,
  )
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

/**
 * Detects whether a Facebook video embed URL points to a Reel.
 *
 * Reels are embedded through the same plugins/video.php endpoint as regular
 * Facebook videos, with the reel's URL passed in the `href` query param, e.g.
 * https://www.facebook.com/plugins/video.php?href=https%3A%2F%2Fwww.facebook.com%2Freel%2F123
 *
 * Reels are vertical (9:16) videos, so we need to detect them to render them
 * in a portrait aspect ratio instead of the default 16:9 box (which clips them).
 */
export const isFacebookReelEmbedUrl = (url: string): boolean => {
  try {
    const urlObject = new URL(url)
    if (!VALID_VIDEO_DOMAINS.fbvideo.includes(urlObject.hostname)) {
      return false
    }
    const href = urlObject.searchParams.get("href")
    if (!href) {
      return false
    }
    return new URL(href).pathname.startsWith("/reel/")
  } catch {
    return false
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
