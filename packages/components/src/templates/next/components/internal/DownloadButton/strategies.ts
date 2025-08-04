import {
  fetchDgsFileDownloadUrl,
  fetchDgsMetadata,
  fetchFileMetadata,
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
        return `Download ${metadata.format} (${metadata.datasetSize})`
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
        const { format, size } = metadata
        if (format && size) {
          return Promise.resolve(`Download ${format.toUpperCase()} (${size})`)
        } else if (format) {
          return Promise.resolve(`Download ${format.toUpperCase()}`)
        } else if (size) {
          return Promise.resolve(`Download (${size})`)
        }
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
