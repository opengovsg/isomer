export const merge = (
  base: string[],
  all: string[],
  mappings: Map<string, string>,
): string[] => {
  const baseSet = new Set(base)
  const allSet = new Set(all)

  // NOTE: values that are in the user given ordering but not in
  // the list of child pages returned from db implies
  // that they have been removed from the current folder
  const toRemoveFromBase = setDifference(baseSet, allSet)
  // NOTE: values that are returned as concrete pages by the db
  // and can be moved around by the user
  const toAdd = setDifference(allSet, baseSet)
  const toRemoveFromBaseSet = new Set(toRemoveFromBase)

  return base
    .filter((resourceId) => !toRemoveFromBaseSet.has(resourceId))
    .concat(
      // NOTE: We have to assume default sort order (alphabetical)
      // when we shift in new items
      Array.from(toAdd).toSorted((a, b) => {
        const aTitle = mappings.get(a) ?? ""
        const bTitle = mappings.get(b) ?? ""

        return aTitle.localeCompare(bTitle, undefined)
      }),
    )
}

// NOTE: Computes items that are in base but not in other
const setDifference = <T>(base: Set<T>, other: Set<T>) => {
  const result = []
  for (const v of base.values()) {
    if (!other.has(v)) {
      result.push(v)
    }
  }

  return result
}
