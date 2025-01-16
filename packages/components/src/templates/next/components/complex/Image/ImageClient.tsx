"use client"

import { useImage } from "~/hooks/useImage"

export interface ImageClientProps {
  src: string
  alt: string
  width: string
  className: string
  assetsBaseUrl?: string
  lazyLoading?: boolean
}

export const ImageClient = ({
  src,
  alt,
  width,
  className,
  assetsBaseUrl,
  lazyLoading = true, // next/image defaults to lazy loading true too
}: ImageClientProps) => {
  const fallback = `${assetsBaseUrl ?? ""}/placeholder_no_image.png`
  const { isLoading, onError } = useImage({ src, fallback })

  return (
    <div
      style={{ width }}
      className={isLoading ? `h-16 animate-pulse bg-slate-800` : undefined}
    >
      <img
        src={src}
        onError={onError}
        alt={alt}
        width={width}
        height="auto"
        className={isLoading ? "hidden" : className}
        loading={lazyLoading ? "lazy" : "eager"}
      />
    </div>
  )
}
