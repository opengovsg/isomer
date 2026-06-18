import { parseAssetRef, rewriteAssetRef } from "@opengovsg/isomer-components"

/**
 * Recursively walks the whole blob (objects, arrays, strings) and returns the
 * deduped list of normalized asset keys for this site.
 */
export const collectAssetKeys = (value: unknown, siteId: number): string[] => {
  const keys = new Set<string>()
  const visit = (v: unknown) => {
    if (typeof v === "string") {
      const key = parseAssetRef(v, siteId)
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

/**
 * Recursively walks the whole blob and rewrites each string via the asset key
 * map. Whole-string only. Mutates `value` in place.
 */
export const rewriteAssetKeys = (
  value: unknown,
  siteId: number,
  oldToNew: ReadonlyMap<string, string>,
): void => {
  if (oldToNew.size === 0) {
    return
  }

  const visit = (v: unknown): unknown => {
    if (typeof v === "string") {
      return rewriteAssetRef(v, oldToNew, siteId)
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
