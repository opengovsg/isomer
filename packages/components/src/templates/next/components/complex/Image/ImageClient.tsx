"use client"

export interface ImageClientProps {
  src: string
  alt: string
  width: string
  className: string
  assetsBaseUrl?: string
  lazyLoading?: boolean
  onLoad?: React.ReactEventHandler<HTMLImageElement>
}

export const ImageClient = ({
  src,
  alt,
  width,
  className,
  assetsBaseUrl,
  lazyLoading = true, // next/image defaults to lazy loading true too
  onLoad,
}: ImageClientProps) => {
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height="auto"
      className={className}
      onLoad={onLoad}
      onError={({ currentTarget }) => {
        currentTarget.onerror = null
        currentTarget.src = `${assetsBaseUrl ?? ""}/placeholder_no_image.png`
      }}
      loading={lazyLoading ? "lazy" : "eager"}
    />
  )
}
