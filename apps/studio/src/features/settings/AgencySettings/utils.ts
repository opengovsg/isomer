import type { SiteEntitySettings } from "@opengovsg/isomer-components"

const compactObject = <T extends object>(
  value: T | undefined,
): T | undefined => {
  if (!value) return undefined

  const entries = Object.entries(value).filter(
    ([, entryValue]) => entryValue !== undefined,
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
