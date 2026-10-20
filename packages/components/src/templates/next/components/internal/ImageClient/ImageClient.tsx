"use client"

import type { ReactEventHandler } from "react"
import type { ImageClientProps } from "~/interfaces"
import { forwardRef } from "react"
import { buildImageTierRendering } from "~/utils/buildImageTierRendering"
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

    const handleLoad: ReactEventHandler<HTMLImageElement> = (e) => {
      // Reveal the image once it loads (it may have been hidden by a prior error
      // while self-healing — see handleError).
      e.currentTarget.style.opacity = "1"
      onLoad?.(e)
    }

    const handleError: ReactEventHandler<HTMLImageElement> = ({
      currentTarget,
    }) => {
      // Reset the counter when the underlying src changed (reused <img>).
      if (currentTarget.dataset.retryBase !== imgSrc) {
        currentTarget.dataset.retryBase = imgSrc
        currentTarget.dataset.retry = "0"
      }
      const attempt = Number(currentTarget.dataset.retry ?? "0")
      if (canRetry && attempt < MAX_RETRIES) {
        currentTarget.dataset.retry = String(attempt + 1)
        // Hide the broken-image glyph while self-healing — handleLoad restores it
        // once a retry succeeds. Leaves blank space (not an error icon) during the
        // propagation window. Inert on the published site (no errors there).
        currentTarget.style.opacity = "0"
        // Cache-bust so the browser re-fetches; the CDN ignores unknown query
        // params for its cache key, so this doesn't fragment the cache.
        const sep = imgSrc.includes("?") ? "&" : "?"
        window.setTimeout(() => {
          currentTarget.src = `${imgSrc}${sep}retry=${attempt + 1}`
        }, retryDelayMs(attempt))
        return
      }
      // Retries exhausted: show the placeholder (visible, not hidden).
      currentTarget.onerror = null
      currentTarget.style.opacity = "1"
      currentTarget.src = placeholderSrc
    }

    // Shared across the single-crop <img> and the per-tier <picture> fallback.
    const commonImgProps = {
      ref,
      src: imgSrc,
      alt,
      width,
      height: "auto",
      onLoad: handleLoad,
      onError: handleError,
      loading: lazyLoading ? "lazy" : ("eager" as const),
      fetchPriority: lazyLoading ? "auto" : ("high" as const),
      decoding: lazyLoading ? "async" : ("auto" as const), // sync can block the main thread
    } as const

    // Per-breakpoint art direction: a <source> per tier (base = the <img>
    // fallback) plus a scoped <style> for the per-breakpoint focal, since
    // object-position can't be varied per breakpoint by an inline style.
    const tierRendering = buildImageTierRendering(
      src,
      imageAdjustment,
      assetsBaseUrl,
    )
    if (tierRendering !== null) {
      return (
        <>
          {/* Scoped focal rules — outside <picture>, which only allows <source>/<img>. */}
          <style dangerouslySetInnerHTML={{ __html: tierRendering.focalCss }} />
          <picture>
            {tierRendering.sources.map((source) => (
              <source
                key={source.media}
                media={source.media}
                srcSet={source.srcSet}
              />
            ))}
            <img
              {...commonImgProps}
              className={`${className} ${tierRendering.focalClassName}`}
            />
          </picture>
        </>
      )
    }

    return (
      <img
        {...commonImgProps}
        className={className}
        style={objectPosition ? { objectPosition } : undefined}
      />
    )
  },
)
