import type { ReactEventHandler } from "react"
import type { ImageAdjustment } from "~/interfaces/complex/Image"

export interface ImageClientProps {
  src: string
  alt: string
  width: string
  className: string
  assetsBaseUrl?: string
  lazyLoading?: boolean
  onLoad?: ReactEventHandler<HTMLImageElement>
  objectPosition?: string // applied as inline object-position only when set
}

export interface ImageClientWithAdjustmentProps extends Omit<
  ImageClientProps,
  "objectPosition"
> {
  imageAdjustment?: ImageAdjustment // source of focal; derived into objectPosition
}
