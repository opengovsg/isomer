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
  objectPosition?: string // focal-point render; applied as inline object-position only when set
  imageAdjustment?: ImageAdjustment // source of focal when objectPosition isn't explicitly given
}
