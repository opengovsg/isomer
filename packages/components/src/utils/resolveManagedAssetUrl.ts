import { isExternalUrl } from "./isExternalUrl"

// Resolve a managed-asset src against assetsBaseUrl. In the editor, append
// original=true to bypass the CDN transcode so a just-saved image shows
// immediately instead of 404ing; on the published site useOriginal is false, so
// the URL is unchanged. External URLs (and absent assetsBaseUrl) pass through.
// Query-aware: uses & when the src already has a query string so the bypass
// isn't swallowed into an existing parameter value.
export const resolveManagedAssetUrl = (
  src: string,
  assetsBaseUrl: string | undefined,
  useOriginal: boolean,
): string => {
  if (isExternalUrl(src) || assetsBaseUrl === undefined) return src

  const resolved = `${assetsBaseUrl}${src}`
  if (!useOriginal) return resolved

  const separator = resolved.includes("?") ? "&" : "?"
  return `${resolved}${separator}original=true`
}
