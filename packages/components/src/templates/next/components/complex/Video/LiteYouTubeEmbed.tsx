"use client"

import type { SVGProps, SyntheticEvent } from "react"
import { useEffect, useState } from "react"

import { twMerge } from "~/lib/twMerge"
import { ImageClient } from "../Image/ImageClient"
import { IFRAME_ALLOW, IFRAME_CLASSNAME } from "./shared"

export interface LiteYouTubeEmbedProps {
  src: string
  videoId: string
  title?: string
  shouldLazyLoad?: boolean
}

// Referenced from https://github.com/ibrahimcesar/react-lite-youtube-embed
export const LiteYouTubeEmbed = ({
  src,
  videoId,
  title,
  shouldLazyLoad = true,
}: LiteYouTubeEmbedProps) => {
  const [activated, setActivated] = useState(false)
  const [oEmbedThumbnailUrl, setOEmbedThumbnailUrl] = useState<string | null>(
    null,
  )

  useEffect(() => {
    // For playlist/video-series embeds, fetch an actual preview image via oEmbed.
    if (videoId) {
      setOEmbedThumbnailUrl(null)
      return
    }

    const fetchThumbnail = async () => {
      try {
        const oEmbedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(src)}&format=json`
        const response = await fetch(oEmbedUrl)
        if (!response.ok) return

        const data = (await response.json()) as { thumbnail_url?: string }
        if (data.thumbnail_url) {
          // Prefer sddefault; oEmbed returns hqdefault. Fallback to hqdefault is handled in onLoad.
          setOEmbedThumbnailUrl(
            data.thumbnail_url.replace("hqdefault", "sddefault"),
          )
        }
      } catch {
        // Best effort only; playback still works without preview image.
      }
    }

    void fetchThumbnail()
  }, [src, videoId])

  //  We add autoplay here because the user already click on the facade button once,
  // and we don't them to have to click again to play.
  const srcWithAutoplay = () => {
    const u = new URL(src)
    u.searchParams.set("autoplay", "1")
    return u.toString()
  }

  // Single-video: use static thumbnail.
  // Playlist/video series: resolve thumbnail via oEmbed.
  const thumbnailUrl = videoId
    ? // we use sddefault as its the best balance between quality and size
      // note: maxresdefault is not available for all videos
      `https://i.ytimg.com/vi/${videoId}/sddefault.jpg`
    : oEmbedThumbnailUrl

  return (
    <>
      {thumbnailUrl && (
        <ImageClient
          src={thumbnailUrl}
          alt={`Thumbnail for ${title || "video"}`}
          width="100%"
          lazyLoading={shouldLazyLoad}
          onLoad={(e: SyntheticEvent<HTMLImageElement, Event>) => {
            const { currentTarget } = e
            // When sddefault.jpg is missing, YouTube returns HTTP 404 with a valid 120×90 JPEG
            // (a placeholder). The browser then fires onLoad, not onError, so we detect the
            // "missing thumbnail" case by dimensions and swap to hqdefault.jpg. Applies to both
            // single-video and oEmbed (playlist) thumbnails.
            if (
              currentTarget.src.endsWith("/sddefault.jpg") &&
              currentTarget.naturalWidth === 120 &&
              currentTarget.naturalHeight === 90
            ) {
              currentTarget.src = currentTarget.src.replace(
                "sddefault.jpg",
                "hqdefault.jpg",
              )
            }
          }}
          className={twMerge(
            "absolute inset-0 h-full w-full bg-black object-cover",
            activated && "pointer-events-none opacity-0",
          )}
        />
      )}
      {activated ? (
        <iframe
          height="100%"
          width="100%"
          className={IFRAME_CLASSNAME}
          src={srcWithAutoplay()}
          title={title || "Video player"}
          allow={`${IFRAME_ALLOW}; autoplay`} // autoplay needed to allow Youtube to autoplay
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
        />
      ) : (
        <button
          type="button"
          onClick={() => setActivated(true)}
          className="group absolute inset-0 flex cursor-pointer items-center justify-center focus:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-utility-highlight focus-visible:ring-offset-2 focus-visible:ring-offset-black"
          aria-label={`Play ${title || "video"}`}
        >
          <YouTubePlayButton
            className="pointer-events-none h-12 w-[68px] shrink-0"
            aria-hidden
          />
        </button>
      )}
    </>
  )
}

/* YouTube play button: squircle + triangle (same as react-lite-youtube-embed) */
const YouTubePlayButton = (props: SVGProps<SVGSVGElement>) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 68 48"
    aria-hidden
    {...props}
  >
    <path
      fill="#FF0033"
      d="M66.52 7.74c-.78-2.93-2.49-5.41-5.42-6.19C55.79.13 34 0 34 0S12.21.13 6.9 1.55c-2.93.78-4.63 3.26-5.42 6.19C.06 13.05 0 24 0 24s.06 10.95 1.48 16.26c.78 2.93 2.49 5.41 5.42 6.19C12.21 47.87 34 48 34 48s21.79-.13 27.1-1.55c2.93-.78 4.64-3.26 5.42-6.19C67.94 34.95 68 24 68 24s-.06-10.95-1.48-16.26z"
    />
    <path fill="#fff" d="M45 24 27 14v20" />
  </svg>
)
