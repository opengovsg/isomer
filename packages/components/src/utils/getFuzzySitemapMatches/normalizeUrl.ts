export const normalizePermalink = (permalink: string) => {
  let path = permalink

  // extract pathname from URL if it's a full URL
  if (path.startsWith("http://") || path.startsWith("https://")) {
    try {
      const url = new URL(path)
      path = url.pathname
    } catch {
      // if URL parsing fails, continue with the original string
    }
  }

  // decode URL-encoded characters
  try {
    path = decodeURIComponent(path)
  } catch {
    // if decoding fails, continue with the original string
  }

  // remove trailing slashes
  path = path.replace(/\/+$/, "")

  // remove leading slash
  path = path.replace(/^\//, "")

  // remove file extension
  path = path.replace(/\.[a-zA-Z0-9]+$/, "")

  // convert delimiters to spaces
  path = path.split(/[-_]/).join(" ")

  // collapse multiple spaces
  path = path.split(" ").filter(Boolean).join(" ")

  return path.toLowerCase()
}