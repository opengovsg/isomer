import {
  fetchDgsFileDownloadUrl,
  fetchDgsMetadata,
  getDgsIdFromDgsLink,
} from "~/utils/dgs"
import { fetchFileMetadata } from "~/utils/fetchFileMetadata"
import { formatBytes } from "~/utils/formatBytes"

interface DownloadStrategy {
  /** Determines if this strategy can handle the given URL */
  canHandle: (url: string) => boolean
  /** Gets the actual download URL for the given URL */
  getDownloadUrl: (url: string) => Promise<string | null>
  /** Optionally provides custom display text for the button */
  getDisplayText: (url: string) => Promise<string | null>
}

const renderDownloadText = ({
  format,
  size,
}: {
  format: string | undefined
  size: number | undefined
}) => {
  const formattedSize = size === undefined ? null : formatBytes(size)
  const hasFormat = format !== undefined && format !== ""
  const hasFormattedSize = formattedSize !== null && formattedSize !== ""

  if (hasFormat && hasFormattedSize) {
    return `Download ${format} (${formattedSize})`
  }

  if (hasFormat) {
    return `Download ${format}`
  }

  if (hasFormattedSize) {
    return `Download (${formattedSize})`
  }

  return "Download"
}

const dgsDownloadStrategy: DownloadStrategy = {
  canHandle: (url: string) => {
    const dgsId = getDgsIdFromDgsLink(url)
    return dgsId !== null
  },
  getDisplayText: async (url: string) => {
    const dgsId = getDgsIdFromDgsLink(url)
    if (dgsId === null) {
      return null
    }

    try {
      const metadata = await fetchDgsMetadata({ resourceId: dgsId })
      if (metadata !== undefined && metadata !== null) {
        return renderDownloadText(metadata)
      }
    } catch (error) {
      console.error("Error fetching DGS metadata:", error)
    }
    return null
  },
  getDownloadUrl: async (url: string) => {
    const dgsId = getDgsIdFromDgsLink(url)
    if (dgsId === null) {
      return null
    }

    const result = await fetchDgsFileDownloadUrl({ resourceId: dgsId })
    const downloadUrl = result?.downloadUrl
    return downloadUrl !== undefined && downloadUrl !== "" ? downloadUrl : null
  },
}

export const directDownloadStrategy: DownloadStrategy = {
  canHandle: () =>
    // Handle direct file URLs or any URL that doesn't match other strategies
    true,
  getDisplayText: async (url: string) => {
    try {
      const metadata = await fetchFileMetadata({ url })
      if (metadata !== undefined && metadata !== null) {
        return renderDownloadText(metadata)
      }
    } catch (error) {
      console.error("Error fetching file metadata:", error)
    }
    return null
  },
  getDownloadUrl: async (url: string) =>
    // For direct URLs, return the URL as-is
    await Promise.resolve(url),
}

/**
 * Default strategy registry with all available download strategies
 */
export const defaultDownloadStrategies: DownloadStrategy[] = [
  dgsDownloadStrategy,
  directDownloadStrategy,
]
