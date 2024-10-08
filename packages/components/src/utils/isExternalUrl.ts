// Determine if the provided URL is an external link
export const isExternalUrl = (url?: string) => {
  return (
    !!url &&
    !url.startsWith("/") &&
    !url.startsWith("#") &&
    !url.startsWith("[resource:")
  )
}
