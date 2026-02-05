"use client"

import { useEffect, useState } from "react"

import { IFRAME_ALLOW, IFRAME_CLASSNAME } from "./shared"

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

  // Fetch the thumbnail URL from Vimeo's oEmbed API
  useEffect(() => {
    const fetchThumbnail = async () => {
      try {
        const response = await fetch(
          `https://vimeo.com/api/v2/video/${videoId}.json`,
        )
        const data = (await response.json()) as VimeoVideoInfo[]
        // Use thumbnail_large (640px) for good quality
        // The URL format is like: https://i.vimeocdn.com/video/{id}_640.jpg
        if (data[0]?.thumbnail_large) {
          setThumbnailUrl(data[0].thumbnail_large)
        }
      } catch {
        // Silently fail - we'll just show a black background
      }
    }

    void fetchThumbnail()
  }, [videoId])

  // We add autoplay here because the user already clicked on the facade button once,
  // and we don't want them to have to click again to play.
  const srcWithAutoplay = () => {
    const u = new URL(src)
    u.searchParams.set("autoplay", "1")
    return u.toString()
  }

  return (
    <>
      <div
        className={`absolute inset-0 h-full w-full bg-black bg-cover bg-center ${activated ? "pointer-events-none opacity-0" : ""}`}
        style={
          thumbnailUrl ? { backgroundImage: `url("${thumbnailUrl}")` } : {}
        }
      >
        {thumbnailUrl && (
          <img
            src={thumbnailUrl}
            alt={`Thumbnail for ${title || "video"}`}
            loading={shouldLazyLoad ? "lazy" : "eager"}
            className="h-full w-full object-cover"
          />
        )}
      </div>
      {!activated && (
        <button
          type="button"
          onClick={() => setActivated(true)}
          className="group absolute inset-0 flex cursor-pointer items-center justify-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
          aria-label={`Play ${title || "video"}`}
        >
          <span className="sr-only">{`Play ${title || "video"}`}</span>
          {/* Vimeo play button: rounded rectangle with triangle */}
          <span className="pointer-events-none flex h-10 w-[65px] shrink-0 items-center justify-center rounded-lg bg-[rgba(23,35,34,0.75)] opacity-80 transition group-hover:bg-[rgb(0,173,239)] group-hover:opacity-100 group-focus:bg-[rgb(0,173,239)] group-focus:opacity-100">
            <span
              className="ml-1"
              style={{
                width: 0,
                height: 0,
                borderStyle: "solid",
                borderWidth: "10px 0 10px 20px",
                borderColor: "transparent transparent transparent #fff",
              }}
            />
          </span>
        </button>
      )}
      {activated && (
        <iframe
          height="100%"
          width="100%"
          className={IFRAME_CLASSNAME}
          src={srcWithAutoplay()}
          title={title || "Video player"}
          allow={`${IFRAME_ALLOW}; autoplay`}
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      )}
    </>
  )
}
