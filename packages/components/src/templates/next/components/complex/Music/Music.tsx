import type { MusicProps } from "~/interfaces"
import { isValidMusicEmbedUrl } from "~/utils/validation"
import { ComponentContent } from "../../internal/customCssClass"

export const Music = ({
  title,
  url,
  shouldLazyLoad = true,
}: MusicProps) => {
  if (!isValidMusicEmbedUrl(url)) {
    return <></>
  }

  return (
    <section className={`${ComponentContent} mt-7 first:mt-0`}>
      {/* NOTE: 152px matches Spotify's default embed height */}
      <div className="h-[152px] w-full overflow-hidden rounded-[12px]">
        <iframe
          height="152"
          width="100%"
          className="h-full w-full border-0"
          src={url}
          title={title || "Music embed"}
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
          loading={shouldLazyLoad ? "lazy" : "eager"}
        />
      </div>
    </section>
  )
}
