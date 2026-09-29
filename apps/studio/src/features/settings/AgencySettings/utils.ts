import type { SiteEntitySettings } from "@opengovsg/isomer-components"

// NOTE: Blank strings are dropped so that a config edited outside this form
// normalises the same way the renderer does before emitting structured data.
const isBlank = (value: unknown) =>
  value === undefined || (typeof value === "string" && !value.trim())

const compactObject = <T extends object>(
  value: T | undefined,
): T | undefined => {
  if (!value) return undefined

  const entries = Object.entries(value).filter(
    ([, entryValue]) => !isBlank(entryValue),
  )

  return entries.length ? (Object.fromEntries(entries) as T) : undefined
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
