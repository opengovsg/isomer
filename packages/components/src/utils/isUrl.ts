export const isUrl = (url: string): boolean => {
  try {
    // The URL constructor will throw if the string is not a valid absolute URL
    const parsedUrl = new URL(url)
    // Require a hostname to ensure it's a complete URL, not just a protocol like "weibo:"
    // This prevents strings like "weibo:" from being recognized as valid URLs
    return !!parsedUrl.hostname || !!parsedUrl.pathname
  } catch {
    return false
  }
}
