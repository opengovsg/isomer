/* oxlint-disable eslint/arrow-body-style -- core cleanup deferred */
import { groupBy } from "lodash-es"
import {
  hasNonEmptyString,
  isDefinedNumber,
  isNullableBooleanTrue,
  isNonEmptyArray,
} from "~/utils/truthiness"

// oxlint-disable-next-line eslint(arrow-body-style -- core cleanup deferred
const normalizedLabelKey = (label: string | undefined): string => {
  return (label ?? "").trim().toLowerCase()
}

/** Indices of items whose `label` duplicates another (trimmed, case-insensitive). Empty labels are ignored. */
export const indicesWithDuplicateLabels = (
  items: { label?: string }[] | undefined,
): Set<number> => {
  if (!isDefinedNumber(items?.length)) {
    return new Set()
  }

  const withKey = items.flatMap((item, index) => {
    const key = normalizedLabelKey(item.label)
    return key ? [{ index, key }] : []
  })

  return new Set(
    Object.values(groupBy(withKey, "key")).flatMap((group) =>
      group.length > 1 ? group.map((e) => e.index) : [],
    ),
  )
}
