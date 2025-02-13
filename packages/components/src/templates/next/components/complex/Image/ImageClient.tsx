"use client"

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
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height="auto"
      className={className}
      onError={({ currentTarget }) => {
        currentTarget.onerror = null
        currentTarget.src = `${assetsBaseUrl ?? ""}/placeholder_no_image.png`
      }}
      loading={lazyLoading ? "lazy" : "eager"}
    />
  )
}
