// Determine if the provided URL is an external link
export const isExternalUrl = (url?: string): boolean => {
  return (
    !!url &&
    !url.startsWith("/") &&
    !url.startsWith("#") &&
    !url.startsWith("[resource:")
  )
}
