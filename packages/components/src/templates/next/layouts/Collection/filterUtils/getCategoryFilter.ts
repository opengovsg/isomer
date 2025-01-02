import type { Filter } from "~/templates/next/types/Filter"
import { FILTER_ID_CATEGORY } from "./constants"

export const getCategoryFilter = ({
  categories,
}: {
  categories: Record<string, number>
}): Filter => {
  return {
    id: FILTER_ID_CATEGORY,
    label: "Category",
    items: Object.entries(categories)
      .map(([label, count]) => ({
        id: label.toLowerCase(),
        label: label.charAt(0).toUpperCase() + label.slice(1),
        count,
      }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  }
}
