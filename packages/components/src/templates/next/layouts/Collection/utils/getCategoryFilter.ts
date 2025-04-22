import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { Filter } from "~/templates/next/types/Filter"
import { FILTER_ID_CATEGORY } from "./constants"

export const getCategoryFilter = (
  items: ProcessedCollectionCardProps[],
): Filter => {
  const categories: Record<string, number> = {}

  items.forEach(({ category }) => {
    if (category in categories && categories[category]) {
      categories[category] += 1
    } else {
      categories[category] = 1
    }
  })

  const categoryFilterItems = Object.entries(categories)
    .map(([label, count]) => ({
      id: label.toLowerCase(),
      label: label.charAt(0).toUpperCase() + label.slice(1),
      count,
    }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { numeric: true }),
    )

  return {
    id: FILTER_ID_CATEGORY,
    label: "Category",
    items: categoryFilterItems,
  }
}
