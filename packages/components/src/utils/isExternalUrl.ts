// Determine if the provided URL is an external link
export const isExternalUrl = (url?: string): url is string => {
  return (
    !!url &&
    !url.startsWith("/") &&
    !url.startsWith("#") &&
    !url.startsWith("[resource:")
  )
}
