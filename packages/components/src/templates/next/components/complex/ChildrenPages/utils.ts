import type { ChildrenPagesProps } from "~/interfaces"

type SortablePage = Pick<ChildPage, "id" | "title">

/**
 * Creates a comparator function for sorting children pages.
 * Precomputes an id -> index map for O(1) lookups during sorting.
 * Overall sorting complexity is O(n log n) instead of O(n² log n).
 */
export const createChildrenPagesComparator = (
  childrenPagesOrdering: ChildrenPagesProps["childrenPagesOrdering"] = [],
) => {
  const orderingMap = new Map(
    childrenPagesOrdering.map((id, index) => [id, index]),
  )

  return (a: SortablePage, b: SortablePage): number => {
    const aIndex = orderingMap.get(a.id) ?? -1
    const bIndex = orderingMap.get(b.id) ?? -1

    if (aIndex === bIndex) {
      return a.title.localeCompare(b.title, undefined, { numeric: true })
    }

    if (aIndex === -1) {
      return 1
    }

    if (bIndex === -1) {
      return -1
    }

    return aIndex - bIndex
  }
}
