import type { SiteEntitySettings } from "@opengovsg/isomer-components"

// NOTE: Blank strings are dropped so that a config edited outside this form
// normalises the same way the renderer does before emitting structured data.
const isBlankString = (value: string | undefined): boolean =>
  value === undefined || !value.trim()

const compactStringRecord = <T extends Record<string, string | undefined>>(
  value: T | undefined,
): T | undefined => {
  if (!value) return undefined

  const entries = Object.entries(value).filter(
    ([, entryValue]) => !isBlankString(entryValue),
  )

  if (!entries.length) return undefined
  // SAFETY: entries only drop blank string fields from the same record shape
  return Object.fromEntries(entries) as T
}

export const normalizeSiteEntity = (
  siteEntity: SiteEntitySettings | undefined,
): SiteEntitySettings | undefined => {
  if (!siteEntity) return undefined

  const result: SiteEntitySettings = {}

  if (!isBlankString(siteEntity.type)) {
    result.type = siteEntity.type
  }
  if (!isBlankString(siteEntity.description)) {
    result.description = siteEntity.description
  }

  const address = compactStringRecord(siteEntity.address)
  if (address) {
    result.address = address
  }

  const contactPoint = compactStringRecord(siteEntity.contactPoint)
  if (contactPoint) {
    result.contactPoint = contactPoint
  }

  if (Object.keys(result).length === 0) {
    return undefined
  }

  return result
}
