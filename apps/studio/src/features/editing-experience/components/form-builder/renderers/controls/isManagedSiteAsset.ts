// Mirrors the uuid part of ASSET_KEY_PATTERN in asset.service.ts.
const UUID_SEGMENT =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"

// True only for a canonical `/${siteId}/${uuid}/${file}` path. Mirrors the
// server's deriveBakeKey, which rejects everything else at save time.
export const isManagedSiteAsset = (
  src: string | undefined,
  siteId: number,
): boolean => {
  if (!src) return false
  const pattern = new RegExp(`^/${siteId}/${UUID_SEGMENT}/[^/]+$`, "i")
  return pattern.test(src)
}
