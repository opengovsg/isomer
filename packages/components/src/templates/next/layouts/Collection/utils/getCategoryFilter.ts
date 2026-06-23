import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { Filter } from "~/templates/next/types/Filter"
import type { CollectionPageCategoryOption } from "~/types/page"

import { FILTER_ID_CATEGORY } from "./constants"

export const getCategoryFilter = (
  items: ProcessedCollectionCardProps[],
  categoryOptions?: CollectionPageCategoryOption[],
): Filter => {
  const categories: Record<string, number> = {}

  items.forEach(({ category }) => {
    if (category in categories && categories[category]) {
      categories[category] += 1
    } else {
      categories[category] = 1
    }
  })

  const categoryFilterItems = Object.entries(categories).map(
    ([label, count]) => ({
      id: label.toLowerCase(),
      label: label.charAt(0).toUpperCase() + label.slice(1),
      count,
    }),
  )

  if (categoryOptions && categoryOptions.length > 0) {
    // Split into two groups: items whose id matches a categoryOption (known) and those that don't
    // (unknown). Known items are ordered by the editor-defined categoryOptions order; unknown items
    // are appended alphabetically. Matching is done on the lowercased id (= lowercased label) so
    // it is case-insensitive and stable even if the display label is later re-cased.
    const categoryOptionLabels = categoryOptions.map(({ label }) =>
      label.toLowerCase(),
    )

    const known = categoryFilterItems.filter(
      (item) => categoryOptionLabels.indexOf(item.id) !== -1,
    )
    const unknown = categoryFilterItems.filter(
      (item) => categoryOptionLabels.indexOf(item.id) === -1,
    )

    known.sort(
      (a, b) =>
        categoryOptionLabels.indexOf(a.id) - categoryOptionLabels.indexOf(b.id),
    )
    unknown.sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { numeric: true }),
    )

    return {
      id: FILTER_ID_CATEGORY,
      label: "Category",
      items: [...known, ...unknown],
    }
  }

  categoryFilterItems.sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { numeric: true }),
  )

  return {
    id: FILTER_ID_CATEGORY,
    label: "Category",
    items: categoryFilterItems,
  }
}
