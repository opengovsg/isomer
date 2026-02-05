import type { VideoProps } from "~/interfaces"
import { isValidVideoUrl, VALID_VIDEO_DOMAINS } from "~/utils/validation"
import { ComponentContent } from "../../internal/customCssClass"
import { LiteVimeoEmbed } from "./LiteVimeoEmbed"
import { LiteYouTubeEmbed } from "./LiteYouTubeEmbed"
import { IFRAME_ALLOW, IFRAME_CLASSNAME } from "./shared"
import { getVimeoVideoId, getYouTubeVideoId } from "./utils"

type ParsedVideo =
  | { type: "youtube"; embedUrl: string; videoId: string }
  | { type: "vimeo"; embedUrl: string; videoId: string }
  | { type: "facebook"; embedUrl: string }

// NOTE: We are only using the privacy-enhanced mode of YouTube embeds
const getPrivacyEnhancedYouTubeEmbedUrl = (urlObject: URL) => {
  if (urlObject.hostname === "www.youtube.com") {
    urlObject.hostname = "www.youtube-nocookie.com"
  }

  const { pathname, searchParams } = urlObject

  if (pathname.startsWith("/embed/")) {
    return urlObject.toString()
  } else if (pathname.startsWith("/watch")) {
    const videoId = searchParams.get("v")
    if (!videoId) {
      return ""
    }

    urlObject.pathname = `/embed/${videoId}`
    urlObject.search = ""

    return urlObject.toString()
  }
}

// NOTE: We are setting a do-not-track attribute on Vimeo embeds
// Ref: https://developer.vimeo.com/api/oembed/videos
const getPrivacyEnhancedVimeoEmbedUrl = (url: string): string => {
  const urlObject = new URL(url)
  urlObject.searchParams.set("dnt", "true")
  return urlObject.toString()
}

/**
 * Parses a video URL and returns the video type plus the privacy-enhanced embed URL (or videoId for YouTube).
 * Returns null for invalid URLs.
 */
const parseVideo = (url: string): ParsedVideo | null => {
  if (!isValidVideoUrl(url)) return null

  const urlObject = new URL(url)

  if (VALID_VIDEO_DOMAINS.youtube.includes(urlObject.hostname)) {
    return {
      type: "youtube",
      embedUrl: getPrivacyEnhancedYouTubeEmbedUrl(urlObject) ?? "",
      videoId: getYouTubeVideoId(url) ?? "",
    }
  } else if (VALID_VIDEO_DOMAINS.vimeo.includes(urlObject.hostname)) {
    return {
      type: "vimeo",
      embedUrl: getPrivacyEnhancedVimeoEmbedUrl(url),
      videoId: getVimeoVideoId(url) ?? "",
    }
  } else if (VALID_VIDEO_DOMAINS.fbvideo.includes(urlObject.hostname)) {
    return { type: "facebook", embedUrl: url }
  } else {
    return null
  }
}

export const Video = ({ title, url, shouldLazyLoad = true }: VideoProps) => {
  const RenderedVideo = () => {
    const parsedVideo = parseVideo(url)
    if (!parsedVideo) return <></>

    const { type: videoType, embedUrl } = parsedVideo
    switch (videoType) {
      case "youtube":
        return (
          <LiteYouTubeEmbed
            src={embedUrl}
            videoId={parsedVideo.videoId}
            title={title}
            shouldLazyLoad={shouldLazyLoad}
          />
        )
      case "vimeo":
        return (
          <LiteVimeoEmbed
            src={embedUrl}
            videoId={parsedVideo.videoId}
            title={title}
            shouldLazyLoad={shouldLazyLoad}
          />
        )
      case "facebook":
        return (
          <iframe
            src={embedUrl}
            title={title || "Video player"}
            loading={shouldLazyLoad ? "lazy" : "eager"}
            height="100%"
            width="100%"
            className={IFRAME_CLASSNAME}
            allow={IFRAME_ALLOW}
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        )
      default:
        const _exhaustiveCheck: never = videoType
        return null
    }
  }

  return (
    <section className={`${ComponentContent} mt-7 first:mt-0`}>
      {/* NOTE: 56.25% is a 16:9 aspect ratio */}
      <div className="relative w-full overflow-hidden pt-[56.25%]">
        <RenderedVideo />
      </div>
    </section>
  )
}
