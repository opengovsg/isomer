import { flatMap, groupBy } from "lodash"

function normalizedLabelKey(label: string | undefined): string {
  return (label ?? "").trim().toLowerCase()
}

/** Indices of items whose `label` duplicates another (trimmed, case-insensitive). Empty labels are ignored. */
export function indicesWithDuplicateLabels(
  items: { label?: string }[] | undefined,
): Set<number> {
  if (!items?.length) return new Set()

  const withKey = items.flatMap((item, index) => {
    const key = normalizedLabelKey(item.label)
    return key ? [{ index, key }] : []
  })

  return new Set(
    flatMap(Object.values(groupBy(withKey, "key")), (group) =>
      group.length > 1 ? group.map((e) => e.index) : [],
    ),
  )
}
