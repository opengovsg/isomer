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
  objectPosition?: string // focal-point render; applied as inline object-position only when set (single-crop path)
  // When this carries per-breakpoint `tiers`, ImageClient renders a <picture>
  // (one <source> per tier, base as the <img> fallback) plus a scoped focal
  // <style>, instead of the plain <img> + inline object-position. Absent/no tiers
  // = today's single-crop behaviour.
  imageAdjustment?: ImageAdjustment
}
