// Matches a canonical v4-style UUID folder: 8-4-4-4-12 hex chars, case-insensitive
const UUID_FOLDER_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Matches the full asset path shape: {digits}/{uuid}/{nonempty-filename}
// after any optional leading "/" has been stripped.
const ASSET_PATH_RE =
  /^(\d+)\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})\/(.+)$/i

/**
 * Returns true if `value` has the shape of a site asset path
 * (`{digits}/{uuid}/{nonempty-filename}` with an optional leading "/"),
 * regardless of which site it belongs to.
 *
 * Use this when you need a siteId-agnostic check (e.g. classifying a link type
 * without knowing the current siteId). Use `parseAssetRef` when you also need
 * to verify the siteId and get the normalised S3 key back.
 */
export const isAssetRef = (value: string): boolean => {
  const trimmed = value.trim()
  const stripped = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed
  return ASSET_PATH_RE.test(stripped)
}

/**
 * Parses a stored asset reference and returns the normalized S3 key (no leading
 * slash) if the value is a valid reference for the given siteId.
 *
 * Accepted forms: `{siteId}/{uuid}/{filename}` or `/{siteId}/{uuid}/{filename}`
 *
 * Returns null for any other string (external URLs, mailto:, page references,
 * wrong siteId, malformed UUIDs, missing filename, etc.).
 */
export const parseAssetRef = (
  value: string,
  siteId: number,
): string | null => {
  const trimmed = value.trim()

  // Strip a single optional leading "/"
  const stripped = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed

  const prefix = `${siteId}/`
  if (!stripped.startsWith(prefix)) {
    return null
  }

  const rest = stripped.slice(prefix.length)
  const slashIndex = rest.indexOf("/")
  if (slashIndex === -1) {
    return null
  }

  const uuid = rest.slice(0, slashIndex)
  const filePart = rest.slice(slashIndex + 1)

  if (!UUID_FOLDER_RE.test(uuid) || filePart.length === 0) {
    return null
  }

  return `${siteId}/${uuid}/${filePart}`
}

/**
 * Given a normalized S3 key (no leading slash) as returned by parseAssetRef,
 * returns a new key for the same site and filename but with a fresh UUID folder.
 *
 * Throws if the key does not belong to the given siteId or has no filename
 * segment after the uuid.
 */
export const buildNewAssetKey = (
  siteId: number,
  sourceKey: string,
): string => {
  const prefix = `${siteId}/`
  if (!sourceKey.startsWith(prefix)) {
    throw new Error(
      `buildNewAssetKey: sourceKey "${sourceKey}" does not belong to siteId ${siteId}`,
    )
  }

  const rest = sourceKey.slice(prefix.length)
  const slashIndex = rest.indexOf("/")
  if (slashIndex === -1) {
    throw new Error(
      `buildNewAssetKey: sourceKey "${sourceKey}" is missing a filename segment after the uuid`,
    )
  }

  const filePart = rest.slice(slashIndex + 1)
  if (filePart.length === 0) {
    throw new Error(
      `buildNewAssetKey: sourceKey "${sourceKey}" has an empty filename segment`,
    )
  }

  const newUuid = globalThis.crypto.randomUUID()
  return `${siteId}/${newUuid}/${filePart}`
}

/**
 * Rewrites a stored asset reference value using the provided oldToNew key map.
 *
 * This is a whole-string operation: if the parsed S3 key is present in oldToNew,
 * the value is rebuilt with the new key, preserving whether the original had a
 * leading slash. Otherwise the value is returned unchanged.
 */
export const rewriteAssetRef = (
  value: string,
  oldToNew: ReadonlyMap<string, string>,
  siteId: number,
): string => {
  const trimmed = value.trim()
  const hasLeadingSlash = trimmed.startsWith("/")

  const oldKey = parseAssetRef(trimmed, siteId)
  if (oldKey === null) {
    return value
  }

  const newKey = oldToNew.get(oldKey)
  if (newKey === undefined) {
    return value
  }

  return hasLeadingSlash ? `/${newKey}` : newKey
}
