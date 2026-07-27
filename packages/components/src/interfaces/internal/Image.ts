import type { ReactEventHandler } from "react"

export interface ImageClientProps {
  src: string
  alt: string
  width: string
  className: string
  assetsBaseUrl?: string
  lazyLoading?: boolean
  onLoad?: ReactEventHandler<HTMLImageElement>
}
