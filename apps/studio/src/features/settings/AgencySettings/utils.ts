import type { SiteEntitySettings } from "@opengovsg/isomer-components"

// NOTE: Blank strings are dropped so that a config edited outside this form
// normalises the same way the renderer does before emitting structured data.
const isBlank = (value: string | undefined): boolean =>
  value === undefined || !value.trim()

const compactObject = <T extends object>(
  value: T | undefined,
): T | undefined => {
  if (!value) return undefined

  const entries = Object.entries(value).filter(
    // SAFETY: caller invariant is checked immediately before this narrowing assertion
    ([, entryValue]) => !isBlank(entryValue as string | undefined),
  )

  if (!entries.length) return undefined
  // SAFETY: filtered entries only drop blank string fields from the same object shape
  return Object.fromEntries(entries) as T
}

export const normalizeSiteEntity = (
  siteEntity: SiteEntitySettings | undefined,
): SiteEntitySettings | undefined => {
  if (!siteEntity) return undefined

  return compactObject({
    ...siteEntity,
    address: compactObject(siteEntity.address),
    contactPoint: compactObject(siteEntity.contactPoint),
  })
}
