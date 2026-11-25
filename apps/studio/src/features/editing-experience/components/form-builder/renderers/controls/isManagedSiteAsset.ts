// Mirrors ASSET_KEY_PATTERN in asset.service.ts, capturing the site id.
// Static so the site id (from the URL) never becomes part of a regex.
const MANAGED_ASSET_PATTERN =
  /^\/(\d+)\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[^/]+$/i

// True only for a canonical `/${siteId}/${uuid}/${file}` path. Mirrors the
// server's deriveBakeKey, which rejects everything else at save time.
export const isManagedSiteAsset = (
  src: string | undefined,
  siteId: number,
): boolean => !!src && MANAGED_ASSET_PATTERN.exec(src)?.[1] === String(siteId)
