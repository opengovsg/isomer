import { formatBytes } from "./formatBytes"

interface FetchFileMetadataProps {
  url: string
}

interface FetchFileMetadataOutput {
  format: string | undefined
  size: string | undefined
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
  let response: Response
  try {
    response = await fetch(url, { method: "HEAD" })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  } catch (error) {
    // Handle network errors, CORS issues, or other fetch failures
    console.error("Error fetching file metadata:", error)
    return null
  }

  // Fallback to extension from URL if format is missing or generic
  // `octet-stream` is a generic MIME type (`application/octet-stream`) used when server doesn't know the file's specific type.
  // It just means "binary data," so the code tries to get the file extension from the URL instead for a more useful format.
  let format = response.headers.get("content-type")?.split("/")[1]
  if (!format || format === "octet-stream") {
    const urlParts = url.split(".")
    if (urlParts.length > 1) {
      format = urlParts.pop()?.toLowerCase()
    }
  }

  const contentLength = response.headers.get("content-length")

  // Parse content length safely, handling invalid values
  let size: string | undefined
  if (contentLength) {
    const parsedLength = parseInt(contentLength, 10)
    if (!isNaN(parsedLength) && parsedLength > 0) {
      size = formatBytes(parsedLength)
    }
  }

  return {
    format,
    size,
  }
}
