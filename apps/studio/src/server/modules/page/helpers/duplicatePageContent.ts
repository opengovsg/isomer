import { randomUUID } from "crypto"

// Canonical v4 UUID string shape (same 8-4-4-4-12 hex pattern as crypto.randomUUID()).
const UUID_FOLDER_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/** New S3 key for a copied asset: same site and filename, new UUID folder. */
export const buildNewAssetFileKeyForSite = (
  siteId: number,
  oldFileKey: string,
): string => {
  const prefix = `${siteId}/`
  if (!oldFileKey.startsWith(prefix)) {
    throw new Error("Expected asset key to start with siteId")
  }
  const rest = oldFileKey.slice(prefix.length)
  const firstSlash = rest.indexOf("/")
  if (firstSlash === -1) {
    throw new Error("Expected asset key to contain uuid and filename")
  }
  const filePart = rest.slice(firstSlash + 1)
  if (!filePart) {
    throw new Error("Expected asset filename segment")
  }
  return `${siteId}/${randomUUID()}/${filePart}`
}

/**
 * If `value` is a Studio asset path for this site, returns the S3 object key
 * (`{siteId}/{uuid}/{file...}`) without a leading slash. Otherwise null.
 */
export const tryParseSiteAssetFileKey = (
  value: string,
  siteId: number,
): string | null => {
  const trimmed = value.trim()
  let path = trimmed
  if (path.startsWith("/")) {
    path = path.slice(1)
  }
  const sitePrefix = `${siteId}/`
  if (!path.startsWith(sitePrefix)) {
    return null
  }
  const rest = path.slice(sitePrefix.length)
  const firstSlash = rest.indexOf("/")
  if (firstSlash === -1) {
    return null
  }
  const uuidPart = rest.slice(0, firstSlash)
  const filePart = rest.slice(firstSlash + 1)
  if (!filePart || !UUID_FOLDER_RE.test(uuidPart)) {
    return null
  }
  return `${sitePrefix}${uuidPart}/${filePart}`
}

export const collectUniqueAssetFileKeys = (
  value: unknown,
  siteId: number,
): string[] => {
  const keys = new Set<string>()
  const visit = (v: unknown) => {
    if (typeof v === "string") {
      const key = tryParseSiteAssetFileKey(v, siteId)
      if (key) {
        keys.add(key)
      }
      return
    }
    if (Array.isArray(v)) {
      v.forEach(visit)
      return
    }
    if (v !== null && typeof v === "object") {
      for (const child of Object.values(v)) {
        visit(child)
      }
    }
  }
  visit(value)
  return [...keys]
}

const sortMappingsLongestOldKeyFirst = (
  map: ReadonlyMap<string, string>,
): [string, string][] =>
  [...map.entries()].sort((a, b) => b[0].length - a[0].length)

/**
 * Rewrites asset paths in arbitrary JSON (page blob). Mutates `value` in place.
 */
export const rewriteAssetFileKeysInValue = (
  value: unknown,
  siteId: number,
  oldToNewFileKey: ReadonlyMap<string, string>,
): void => {
  if (oldToNewFileKey.size === 0) {
    return
  }
  const ordered = sortMappingsLongestOldKeyFirst(oldToNewFileKey)

  const rewriteString = (s: string): string => {
    const fullKey = tryParseSiteAssetFileKey(s, siteId)
    if (fullKey) {
      const newKey = oldToNewFileKey.get(fullKey)
      if (newKey) {
        const t = s.trim()
        return t.startsWith("/") ? `/${newKey}` : newKey
      }
    }
    let out = s
    for (const [oldKey, newKey] of ordered) {
      out = out.replaceAll(`/${oldKey}`, `/${newKey}`)
    }
    return out
  }

  const visit = (v: unknown): unknown => {
    if (typeof v === "string") {
      return rewriteString(v)
    }
    if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) {
        v[i] = visit(v[i])
      }
      return v
    }
    if (v !== null && typeof v === "object") {
      for (const k of Object.keys(v)) {
        ;(v as Record<string, unknown>)[k] = visit(
          (v as Record<string, unknown>)[k],
        )
      }
      return v
    }
    return v
  }
  visit(value)
}
