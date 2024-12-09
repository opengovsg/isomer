import type { VideoProps } from "~/interfaces"
import { isValidVideoUrl, VALID_VIDEO_DOMAINS } from "~/utils/validation"
import { ComponentContent } from "../../internal/customCssClass"

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
const getPrivacyEnhancedVimeoEmbedUrl = (urlObject: URL) => {
  urlObject.searchParams.set("dnt", "true")
  return urlObject.toString()
}

const getSanitizedEmbedUrl = (url: string) => {
  const urlObject = new URL(url)

  if (VALID_VIDEO_DOMAINS.youtube.includes(urlObject.hostname)) {
    return getPrivacyEnhancedYouTubeEmbedUrl(urlObject)
  } else if (VALID_VIDEO_DOMAINS.vimeo.includes(urlObject.hostname)) {
    return getPrivacyEnhancedVimeoEmbedUrl(urlObject)
  } else if (VALID_VIDEO_DOMAINS.fbvideo.includes(urlObject.hostname)) {
    return urlObject.toString()
  }

  return ""
}

export const Video = ({ title, url }: VideoProps) => {
  if (!isValidVideoUrl(url)) {
    return <></>
  }

  return (
    <section className={`${ComponentContent} mt-7 first:mt-0`}>
      {/* NOTE: 56.25% is a 16:9 aspect ratio */}
      <div className="relative w-full overflow-hidden pt-[56.25%]">
        <iframe
          height="100%"
          width="100%"
          className="absolute bottom-0 left-0 right-0 top-0 border-0"
          src={getSanitizedEmbedUrl(url)}
          title={title || "Video player"}
          // NOTE: We explicitly disallow autoplay as it is not gold-standard
          allow="accelerometer; clipboard-write; encrypted-media; fullscreen; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      </div>
    </section>
  )
}
