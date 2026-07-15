/** Indices of items whose `label` is missing/blank/whitespace-only. */
export function indicesWithBlankLabels(
  items: { label?: string }[] | undefined,
): Set<number> {
  if (!items?.length) return new Set()
  return new Set(
    items.flatMap((item, index) => (!item.label?.trim() ? [index] : [])),
  )
}
