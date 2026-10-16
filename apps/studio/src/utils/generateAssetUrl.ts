import { env } from "~/env.mjs"

export const ASSETS_BASE_URL = env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME
  ? `https://${env.NEXT_PUBLIC_S3_ASSETS_DOMAIN_NAME}`
  : ""

export const generateAssetUrl = (url: string): string => {
  return !!url && url.startsWith("/") ? `${ASSETS_BASE_URL}${url}` : url
}

// Fetch the pristine, un-transcoded original. The delivery CDN transcodes
// images by default and can even serve a generic "binary/octet-stream"
// content-type; baking needs the real original bytes and type, so bypass the
// transcode with ?original=true.
export const generateOriginalAssetUrl = (url: string): string => {
  const resolved = generateAssetUrl(url)
  if (!resolved) return resolved
  const separator = resolved.includes("?") ? "&" : "?"
  return `${resolved}${separator}original=true`
}
