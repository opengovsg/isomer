"use client"

import type { ImageClientProps } from "~/interfaces"
import { forwardRef } from "react"
import { getFocalObjectPosition } from "~/utils/getFocalObjectPosition"
import { isExternalUrl } from "~/utils/isExternalUrl"
import { resolveManagedAssetUrl } from "~/utils/resolveManagedAssetUrl"

// A just-saved/just-uploaded managed asset isn't servable for a window (its CDN
// variant isn't built and its original isn't malware-scanned yet), so the first
// load can 404/403. Retry the same URL with bounded exponential backoff before
// the placeholder, so the image resolves on its own once it propagates — no
// manual refresh. Done via plain DOM in onError (no React hooks), so ImageClient
// stays a trivial component that renders safely in every context. Inert on the
// published site, where assets are long-settled and never error.
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
      imageAdjustment,
    },
    ref,
  ) => {
    const imgSrc = resolveManagedAssetUrl(src, assetsBaseUrl)
    const placeholderSrc = `${assetsBaseUrl ?? ""}/placeholder_no_image.png`
    // Only self-heal managed assets — an external URL's error is permanent, and a
    // cache-bust query could break a signed external URL.
    const canRetry = !isExternalUrl(src) && assetsBaseUrl !== undefined

    // Explicit objectPosition wins; otherwise derive focal from imageAdjustment.
    const resolvedObjectPosition =
      objectPosition ?? getFocalObjectPosition(imageAdjustment)

    return (
      <img
        ref={ref}
        src={imgSrc}
        alt={alt}
        width={width}
        height="auto"
        className={className}
        style={
          resolvedObjectPosition
            ? { objectPosition: resolvedObjectPosition }
            : undefined
        }
        onLoad={(e) => {
          // Reveal the image once it loads (it may have been hidden by a prior
          // error while self-healing — see onError).
          e.currentTarget.style.opacity = "1"
          // Cancel any retry still pending from an earlier src on this same
          // <img> node (e.g. the `src` prop changed and the new image loaded
          // fine before the old retry's timer fired) -- otherwise that stale
          // timer still fires later and overwrites this successfully-loaded
          // image with a cache-busted URL for the OLD src.
          const pendingRetry = e.currentTarget.dataset.retryTimeoutId
          if (pendingRetry) {
            window.clearTimeout(Number(pendingRetry))
            delete e.currentTarget.dataset.retryTimeoutId
          }
          onLoad?.(e)
        }}
        onError={({ currentTarget }) => {
          // Reset the counter when the underlying src changed (reused <img>).
          if (currentTarget.dataset.retryBase !== imgSrc) {
            currentTarget.dataset.retryBase = imgSrc
            currentTarget.dataset.retry = "0"
          }
          const attempt = Number(currentTarget.dataset.retry ?? "0")
          if (canRetry && attempt < MAX_RETRIES) {
            currentTarget.dataset.retry = String(attempt + 1)
            // Hide the broken-image glyph while self-healing — onLoad restores it
            // once a retry succeeds. Leaves blank space (not an error icon) during
            // the propagation window. Inert on the published site (no errors there).
            currentTarget.style.opacity = "0"
            // Cache-bust so the browser re-fetches; the CDN ignores unknown query
            // params for its cache key, so this doesn't fragment the cache.
            const sep = imgSrc.includes("?") ? "&" : "?"
            const timeoutId = window.setTimeout(() => {
              delete currentTarget.dataset.retryTimeoutId
              currentTarget.src = `${imgSrc}${sep}retry=${attempt + 1}`
            }, retryDelayMs(attempt))
            currentTarget.dataset.retryTimeoutId = String(timeoutId)
            return
          }
          // Retries exhausted: show the placeholder (visible, not hidden).
          currentTarget.onerror = null
          currentTarget.style.opacity = "1"
          currentTarget.src = placeholderSrc
        }}
        loading={lazyLoading ? "lazy" : "eager"}
        fetchPriority={lazyLoading ? "auto" : "high"}
        decoding={lazyLoading ? "async" : "auto"} // sync decoding can block the main thread
      />
    )
  },
)
