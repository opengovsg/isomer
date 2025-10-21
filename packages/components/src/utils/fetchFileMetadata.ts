interface FetchFileMetadataProps {
  url: string
}

interface FetchFileMetadataOutput {
  format: string | undefined
  size: number | undefined
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
  let format = response.headers
    .get("content-type")
    ?.split("/")[1] //
    ?.split(";")[0] // Correctly remove MIME type parameters e.g. "text/plain; charset=utf-8" will correctly extract "plain" instead of "plain; charset=utf-8".
  if (!format || format === "octet-stream") {
    const pathnameParts = pathname.split(".")
    if (pathnameParts.length > 1) {
      format = pathnameParts.pop()?.toLowerCase()
    }
  }

  const contentLength = response.headers.get("content-length")

  // Parse content length safely, handling invalid values
  let size
  if (contentLength) {
    const parsedLength = parseInt(contentLength, 10)
    if (!isNaN(parsedLength) && parsedLength > 0) {
      size = parsedLength
    }
  }

  return {
    format,
    size,
  }
}
