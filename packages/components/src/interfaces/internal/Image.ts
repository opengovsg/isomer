export interface ImageClientProps {
  src: string
  alt: string
  width: string
  className: string
  assetsBaseUrl?: string
  lazyLoading?: boolean
  fetchPriority?: "auto" | "high" | "low"
  onLoad?: React.ReactEventHandler<HTMLImageElement>
}
