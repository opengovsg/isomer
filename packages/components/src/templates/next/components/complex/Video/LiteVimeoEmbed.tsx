"use client"

import { useRef, useState } from "react"
import { twMerge } from "~/lib/twMerge"
import { hasNonEmptyString } from "~/utils/truthiness"

import { ImageClient } from "../../internal/ImageClient"
import { IFRAME_ALLOW, IFRAME_CLASSNAME, IFRAME_SANDBOX } from "./shared"

const VimeoPlayButton = () => (
  <span
    className="pointer-events-none flex h-10 w-[65px] shrink-0 items-center justify-center rounded-lg bg-[#15D5FF]"
    aria-hidden
  >
    <span
      className="ml-1"
      style={{
        borderColor: "transparent transparent transparent #000",
        borderStyle: "solid",
        borderWidth: "10px 0 10px 20px",
        height: 0,
        width: 0,
      }}
    />
  </span>
)

// Vimeo API v2 response shape (partial)
interface VimeoVideoInfo {
  thumbnail_large: string
}

export interface LiteVimeoEmbedProps {
  src: string
  videoId: string
  title?: string
  shouldLazyLoad?: boolean
}

// Referenced https://github.com/luwes/lite-vimeo-embed
export const LiteVimeoEmbed = ({
  src,
  videoId,
  title,
  shouldLazyLoad = true,
}: LiteVimeoEmbedProps) => {
  const [activated, setActivated] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const thumbnailFetchStarted = useRef(false)

  // Fetch the thumbnail URL from Vimeo's oEmbed API
  const fetchThumbnail = async () => {
    try {
      const response = await fetch(
        `https://vimeo.com/api/v2/video/${videoId}.json`,
      )
      // SAFETY: Vimeo oEmbed returns an array of video metadata objects for the requested id.
      // oxlint-disable-next-line @typescript-eslint/no-unsafe-type-assertion -- untyped Vimeo API JSON boundary
      const data = (await response.json()) as VimeoVideoInfo[]
      // Use thumbnail_large (640px) for good quality
      // The URL format is like: https://i.vimeocdn.com/video/{id}_640.jpg
      if (hasNonEmptyString(data[0]?.thumbnail_large)) {
        setThumbnailUrl(data[0].thumbnail_large)
      }
    } catch {
      // Silently fail - we'll just show a black background
    }
  }

  const startThumbnailFetch = () => {
    if (thumbnailFetchStarted.current) {
      return
    }
    thumbnailFetchStarted.current = true
    void fetchThumbnail()
  }

  // We add autoplay here because the user already clicked on the facade button once,
  // and we don't want them to have to click again to play.
  const srcWithAutoplay = () => {
    const u = new URL(src)
    u.searchParams.set("autoplay", "1")
    return u.toString()
  }

  return (
    <>
      {hasNonEmptyString(thumbnailUrl) ? (
        <ImageClient
          src={thumbnailUrl}
          alt={`Thumbnail for ${hasNonEmptyString(title) ? title : "video"}`}
          width="100%"
          lazyLoading={shouldLazyLoad}
          className={twMerge(
            "absolute inset-0 h-full w-full bg-black object-cover",
            activated && "pointer-events-none opacity-0",
          )}
        />
      ) : (
        <div
          ref={(node) => {
            if (node !== undefined && node !== null) {
              startThumbnailFetch()
            }
          }}
          className={twMerge(
            "absolute inset-0 h-full w-full bg-black",
            activated && "pointer-events-none opacity-0",
          )}
          aria-hidden
        />
      )}
      {activated ? (
        <iframe
          height="100%"
          width="100%"
          className={IFRAME_CLASSNAME}
          src={srcWithAutoplay()}
          title={hasNonEmptyString(title) ? title : "Video player"}
          // autoplay needed to allow Vimeo to autoplay
          allow={`${IFRAME_ALLOW}; autoplay`}
          sandbox={IFRAME_SANDBOX}
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => {
            setActivated(true)
          }}
          className="group absolute inset-0 flex cursor-pointer items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-utility-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          aria-label={`Play ${hasNonEmptyString(title) ? title : "video"}`}
        >
          <VimeoPlayButton />
        </button>
      )}
    </>
  )
}
