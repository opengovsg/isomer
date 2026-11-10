// The UUID folder segment the server mints for every managed upload. Mirrors
// the uuid portion of ASSET_KEY_PATTERN in asset.service.ts.
const UUID_SEGMENT =
  "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}"

// An image src is adjustable only if it's a managed asset this site can bake:
// a canonical `/${siteId}/${uuid}/${file}` storage path. This mirrors the
// server's bake gate (deriveBakeKey → parseAssetUrlToKey + the
// `folder.startsWith(`${siteId}/`)` check): anything else — the built-in
// placeholder, external/absolute URLs, protocol-relative `//host/path`,
// root-relative legacy paths like `/images/foo.jpg`, and another site's
// `/99/...` asset — is rejected at save time, so we must not offer "Adjust"
// for it here.
export const isManagedSiteAsset = (
  src: string | undefined,
  siteId: number,
): boolean => {
  if (!src) return false
  const pattern = new RegExp(`^/${siteId}/${UUID_SEGMENT}/[^/]+$`, "i")
  return pattern.test(src)
}
