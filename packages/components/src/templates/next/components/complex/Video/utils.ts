import { VALID_VIDEO_DOMAINS } from "~/utils/validation"

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
      return id || null
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
