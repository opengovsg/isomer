import { formatBytes } from "./formatBytes"

interface FetchFileMetadataProps {
  url: string
}

interface FetchFileMetadataOutput {
  format: string
  size: string
}

export const fetchFileMetadata = async ({
  url,
}: FetchFileMetadataProps): Promise<FetchFileMetadataOutput | null> => {
  let pathname: string | null = null
  try {
    pathname = new URL(url).pathname
  } catch {
    if (url.startsWith("/")) {
      pathname = url
    }
  }

  if (!pathname) {
    return null
  }

  // We use HEAD request to get the file metadata without downloading the file
  const response = await fetch(url, { method: "HEAD" })

  if (!response.ok) {
    return null
  }

  // Fallback to extension from URL if format is missing or generic
  let format = response.headers.get("content-type")?.split("/")[1]
  if (!format || format === "octet-stream") {
    const urlParts = url.split(".")
    if (urlParts.length > 1) {
      format = urlParts.pop()?.toLowerCase()
    }
  }

  const contentLength = response.headers.get("content-length")

  if (!format || !contentLength) {
    return null
  }

  return {
    format,
    size: formatBytes(contentLength ? parseInt(contentLength, 10) : 0),
  }
}
