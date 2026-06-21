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
    // Sort by the editor-defined order in categoryOptions; unknown categories fall to the end
    const categoryOptionLabels = categoryOptions.map(({ label }) => label)
    categoryFilterItems.sort((a, b) => {
      const indexA = categoryOptionLabels.indexOf(a.label)
      const indexB = categoryOptionLabels.indexOf(b.label)

      if (indexA === -1 && indexB === -1) return 0 // both unknown, preserve order
      if (indexA === -1) return 1 // a unknown, push after b
      if (indexB === -1) return -1 // b unknown, push after a

      return indexA - indexB
    })
  } else {
    categoryFilterItems.sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { numeric: true }),
    )
  }

  return {
    id: FILTER_ID_CATEGORY,
    label: "Category",
    items: categoryFilterItems,
  }
}
