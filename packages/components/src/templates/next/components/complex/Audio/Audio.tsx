import type { AudioProps } from "~/interfaces"
import { isApplePodcastUrl, isValidAudioEmbedUrl } from "~/utils/validation"

import { IFRAME_SANDBOX } from "../../complex/Video/shared"
import { ComponentContent } from "../../internal/customCssClass"

export const Audio = ({ title, url, shouldLazyLoad = true }: AudioProps) => {
  if (!isValidAudioEmbedUrl(url)) {
    return null
  }

  if (isApplePodcastUrl(url)) {
    const isEpisode = new URL(url).searchParams.has("i")
    const heightPx = isEpisode ? 175 : 450
    return (
      <section className={`${ComponentContent} mt-7 first:mt-0`}>
        {/* Apple Podcast: show 450px, episode 175px; 10px radius; 100% width */}
        <div
          className="w-full overflow-hidden rounded-[10px]"
          style={{ height: heightPx }}
        >
          <iframe
            height={`${heightPx}px`}
            width="100%"
            className="h-full w-full border-0"
            src={url}
            title={title || "Audio embed"}
            allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
            sandbox={IFRAME_SANDBOX}
            referrerPolicy="strict-origin-when-cross-origin"
            loading={shouldLazyLoad ? "lazy" : "eager"}
          />
        </div>
      </section>
    )
  }

  return (
    <section className={`${ComponentContent} mt-7 first:mt-0`}>
      {/* Spotify: 152px default embed height */}
      <div className="h-[152px] w-full overflow-hidden rounded-[12px]">
        <iframe
          height="152px"
          width="100%"
          className="h-full w-full border-0"
          src={url}
          title={title || "Audio embed"}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          sandbox={IFRAME_SANDBOX}
          referrerPolicy="strict-origin-when-cross-origin"
          loading={shouldLazyLoad ? "lazy" : "eager"}
        />
      </div>
    </section>
  )
}
