"use client"

interface ImageClientProps {
  src: string
  alt: string
  width: string
  className: string
  assetsBaseUrl?: string
}

export const ImageClient = ({
  src,
  alt,
  width,
  className,
  assetsBaseUrl,
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
    />
  )
}
