import {
  fetchDgsFileDownloadUrl,
  fetchDgsMetadata,
  fetchFileMetadata,
  formatBytes,
  getDgsIdFromDgsLink,
} from "~/utils"

interface DownloadStrategy {
  /** Determines if this strategy can handle the given URL */
  canHandle: (url: string) => boolean
  /** Gets the actual download URL for the given URL */
  getDownloadUrl: (url: string) => Promise<string | null>
  /** Optionally provides custom display text for the button */
  getDisplayText: (url: string) => Promise<string | null>
}

const dgsDownloadStrategy: DownloadStrategy = {
  canHandle: (url: string) => {
    const dgsId = getDgsIdFromDgsLink(url)
    return dgsId !== null
  },
  getDownloadUrl: async (url: string) => {
    const dgsId = getDgsIdFromDgsLink(url)
    if (!dgsId) return null

    const result = await fetchDgsFileDownloadUrl({ resourceId: dgsId })
    return result?.downloadUrl || null
  },
  getDisplayText: async (url: string) => {
    const dgsId = getDgsIdFromDgsLink(url)
    if (!dgsId) return null

    try {
      const metadata = await fetchDgsMetadata({ resourceId: dgsId })
      if (metadata) {
        return renderDownloadText(metadata)
      }
    } catch (error) {
      console.error("Error fetching DGS metadata:", error)
    }
    return null
  },
}

export const directDownloadStrategy: DownloadStrategy = {
  canHandle: () => {
    // Handle direct file URLs or any URL that doesn't match other strategies
    return true
  },
  getDownloadUrl: (url: string) => {
    // For direct URLs, return the URL as-is
    return Promise.resolve(url)
  },
  getDisplayText: async (url: string) => {
    try {
      const metadata = await fetchFileMetadata({ url })
      if (metadata) {
        return renderDownloadText({
          format: metadata.format,
          size: metadata.size,
        })
      }
    } catch (error) {
      console.error("Error fetching file metadata:", error)
    }
    return null
  },
}

/**
 * Default strategy registry with all available download strategies
 */
export const defaultDownloadStrategies: DownloadStrategy[] = [
  dgsDownloadStrategy,
  directDownloadStrategy, // Fallback strategy
]

interface RenderDownloadTextProps {
  format: string | undefined
  size: number | undefined
}
const renderDownloadText = ({ format, size }: RenderDownloadTextProps) => {
  const formattedSize = size !== undefined ? formatBytes(size) : null
  if (format && formattedSize) {
    return `Download ${format} (${formattedSize})`
  } else if (format) {
    return `Download ${format}`
  } else if (formattedSize) {
    return `Download (${formattedSize})`
  } else {
    return "Download"
  }
}
