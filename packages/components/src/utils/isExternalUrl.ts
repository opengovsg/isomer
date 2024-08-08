// Determine if the provided URL is an external link
export const isExternalUrl = (url: string) => {
  return (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("tel:") ||
    url.startsWith("mailto:")
  )
}
