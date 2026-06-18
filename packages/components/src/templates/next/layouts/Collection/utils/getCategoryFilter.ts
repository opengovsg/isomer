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
    const categoryOptionLabels = categoryOptions.map(({ label }) => label)
    categoryFilterItems.sort((a, b) => {
      const indexA = categoryOptionLabels.indexOf(a.label)
      const indexB = categoryOptionLabels.indexOf(b.label)

      if (indexA === -1 && indexB === -1) return 0
      if (indexA === -1) return 1
      if (indexB === -1) return -1

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
