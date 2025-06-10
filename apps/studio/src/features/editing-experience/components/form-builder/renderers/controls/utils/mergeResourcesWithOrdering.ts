import { difference } from "lodash"

export const mergeResourcesWithOrdering = (
  base: string[],
  all: string[],
  mappings: Map<string, string>,
): string[] => {
  // NOTE: values that are in the user given ordering but not in
  // the list of child pages returned from db implies
  // that they have been removed from the current folder
  const toRemoveFromBase = difference(base, all)
  // NOTE: values that are returned as concrete pages by the db
  // and can be moved around by the user
  const toAdd = difference(all, base)
  const toRemoveFromBaseSet = new Set(toRemoveFromBase)

  return base
    .filter((resourceId) => !toRemoveFromBaseSet.has(resourceId))
    .concat(
      // NOTE: We have to assume default sort order (alphabetical)
      // when we shift in new items
      Array.from(toAdd).toSorted((a, b) => {
        const aTitle = mappings.get(a) ?? ""
        const bTitle = mappings.get(b) ?? ""

        return aTitle.localeCompare(bTitle, undefined, { numeric: true })
      }),
    )
}
