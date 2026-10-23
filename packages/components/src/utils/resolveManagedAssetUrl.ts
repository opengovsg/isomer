import { isExternalUrl } from "./isExternalUrl"

// Resolve a managed-asset src against assetsBaseUrl. External URLs (and an
// absent assetsBaseUrl) pass through unchanged.
export const resolveManagedAssetUrl = (
  src: string,
  assetsBaseUrl: string | undefined,
): string => {
  if (isExternalUrl(src) || assetsBaseUrl === undefined) return src
  return `${assetsBaseUrl}${src}`
}
