import type { VideoProps } from "~/interfaces"
import { isValidVideoUrl, VALID_VIDEO_DOMAINS } from "~/utils/validation"

import { ComponentContent } from "../../internal/customCssClass"
import { LiteVimeoEmbed } from "./LiteVimeoEmbed"
import { LiteYouTubeEmbed } from "./LiteYouTubeEmbed"
import { IFRAME_ALLOW, IFRAME_CLASSNAME } from "./shared"
import {
  getPrivacyEnhancedVimeoEmbedUrl,
  getPrivacyEnhancedYouTubeEmbedUrl,
  getVimeoVideoId,
  getYouTubeVideoId,
  isFacebookReelEmbedUrl,
} from "./utils"

type ParsedVideo =
  | { type: "youtube"; embedUrl: string; videoId: string }
  | { type: "vimeo"; embedUrl: string; videoId: string }
  | { type: "facebook"; embedUrl: string; isReel: boolean }

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
    return {
      type: "facebook",
      embedUrl: url,
      isReel: isFacebookReelEmbedUrl(url),
    }
  } else {
    return null
  }
}

export const Video = ({ title, url, shouldLazyLoad = true }: VideoProps) => {
  const parsedVideo = parseVideo(url)
  if (!parsedVideo) return null

  // Facebook Reels are vertical (9:16) videos. Rendering them in the default
  // landscape (16:9) box clips the content, so we use a portrait aspect ratio
  // and cap the width to keep the embed at a sensible height on wider screens.
  const isPortrait = parsedVideo.type === "facebook" && parsedVideo.isReel

  const renderVideo = () => {
    switch (parsedVideo.type) {
      case "youtube":
        return (
          <LiteYouTubeEmbed
            src={parsedVideo.embedUrl}
            videoId={parsedVideo.videoId}
            title={title}
            shouldLazyLoad={shouldLazyLoad}
          />
        )
      case "vimeo":
        return (
          <LiteVimeoEmbed
            src={parsedVideo.embedUrl}
            videoId={parsedVideo.videoId}
            title={title}
            shouldLazyLoad={shouldLazyLoad}
          />
        )
      case "facebook":
        // there's no lite facebook embed to copy from
        return (
          <iframe
            src={parsedVideo.embedUrl}
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
        const _exhaustiveCheck: never = parsedVideo
        return null
    }
  }

  return (
    <section className={`${ComponentContent} mt-7 first:mt-0`}>
      <div
        className={isPortrait ? "mx-auto w-full max-w-[20.3125rem]" : "w-full"}
      >
        {/* NOTE: 56.25% is a 16:9 (landscape) aspect ratio; 177.78% is a 9:16 (portrait) aspect ratio */}
        <div
          className={`relative w-full overflow-hidden ${
            isPortrait ? "pt-[177.78%]" : "pt-[56.25%]"
          }`}
        >
          {renderVideo()}
        </div>
      </div>
    </section>
  )
}
