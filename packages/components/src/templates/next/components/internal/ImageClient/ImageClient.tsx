"use client"

import type { ImageClientProps } from "~/interfaces"
import { forwardRef, useEffect, useRef, useState } from "react"
import { isExternalUrl } from "~/utils/isExternalUrl"
import { resolveManagedAssetUrl } from "~/utils/resolveManagedAssetUrl"

// A just-saved/just-uploaded managed asset isn't servable for a window (its CDN
// variant isn't built and its original isn't malware-scanned yet), so the first
// load can 404/403. Retry the same URL with bounded exponential backoff before
// the placeholder, so the image resolves on its own once it propagates — no
// manual refresh. Inert on the published site, where assets are long-settled and
// never error.
const MAX_RETRIES = 5
const retryDelayMs = (attempt: number) => Math.min(1000 * 2 ** attempt, 16000)

export const ImageClient = forwardRef<
  HTMLImageElement,
  Omit<ImageClientProps, "ref">
>(
  (
    {
      src,
      alt,
      width,
      className,
      assetsBaseUrl,
      lazyLoading = true, // next/image defaults to lazy loading true too
      onLoad,
      objectPosition,
    },
    ref,
  ) => {
    const resolvedSrc = resolveManagedAssetUrl(src, assetsBaseUrl)
    const placeholderSrc = `${assetsBaseUrl ?? ""}/placeholder_no_image.png`
    // Only self-heal managed assets — an external URL's 404 is permanent, and a
    // cache-bust query could break a signed external URL.
    const canRetry = !isExternalUrl(src) && assetsBaseUrl !== undefined

    const [displaySrc, setDisplaySrc] = useState(resolvedSrc)
    const attemptRef = useRef(0)
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Reset the retry chain whenever the resolved src changes (new draft/image).
    useEffect(() => {
      attemptRef.current = 0
      setDisplaySrc(resolvedSrc)
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current)
      }
    }, [resolvedSrc])

    const handleError = () => {
      if (displaySrc === placeholderSrc) return // placeholder itself failed
      if (canRetry && attemptRef.current < MAX_RETRIES) {
        const attempt = attemptRef.current++
        timerRef.current = setTimeout(() => {
          // Cache-bust so the browser re-fetches; the CDN ignores unknown query
          // params for its cache key, so this doesn't fragment the cache.
          const sep = resolvedSrc.includes("?") ? "&" : "?"
          setDisplaySrc(`${resolvedSrc}${sep}retry=${attempt + 1}`)
        }, retryDelayMs(attempt))
        return
      }
      setDisplaySrc(placeholderSrc)
    }

    return (
      <img
        ref={ref}
        src={displaySrc}
        alt={alt}
        width={width}
        height="auto"
        className={className}
        style={objectPosition ? { objectPosition } : undefined}
        onLoad={onLoad}
        onError={handleError}
        loading={lazyLoading ? "lazy" : "eager"}
        fetchPriority={lazyLoading ? "auto" : "high"}
        decoding={lazyLoading ? "async" : "auto"} // sync decoding can block the main thread
      />
    )
  },
)
