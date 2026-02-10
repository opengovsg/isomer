import type { AudioProps } from "~/interfaces"
import { isApplePodcastUrl, isValidAudioEmbedUrl } from "~/utils/validation"
import { ComponentContent } from "../../internal/customCssClass"

export const Audio = ({ title, url, shouldLazyLoad = true }: AudioProps) => {
  if (!isValidAudioEmbedUrl(url)) {
    return <></>
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
            height={heightPx}
            width="100%"
            className="h-full w-full border-0"
            src={url}
            title={title || "Audio embed"}
            allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write"
            sandbox="allow-forms allow-popups allow-same-origin allow-scripts allow-storage-access-by-user-activation allow-top-navigation-by-user-activation"
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
          height="152"
          width="100%"
          className="h-full w-full border-0"
          src={url}
          title={title || "Audio embed"}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          loading={shouldLazyLoad ? "lazy" : "eager"}
        />
      </div>
    </section>
  )
}
