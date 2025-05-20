import type { Filter, FilterItem } from "../../../types/Filter"
import type { ProcessedCollectionCardProps } from "~/interfaces"

export const getTagFilters = (
  items: ProcessedCollectionCardProps[],
): Filter[] => {
  // NOTE: Each tag is a mapping of a category to its
  // associated set of values as well as the selected value.
  // Hence, we store a map here of the category (eg: Body parts)
  // to the number of occurences of each value (eg: { Brain: 3, Leg: 2})
  const tagCategories = new Map<string, Map<string, number>>()

  items.forEach(({ tags }) => {
    if (tags) {
      tags.forEach(({ selected: selectedLabels, category }) => {
        if (!tagCategories.has(category)) {
          tagCategories.set(category, new Map())
        }
        const categoryMap = tagCategories.get(category) ?? new Map()
        selectedLabels.forEach((label) => {
          if (!categoryMap.has(label)) {
            categoryMap.set(label, 0)
          }
          categoryMap.set(label, (categoryMap.get(label) ?? 0) + 1)
        })
      })
    }
  })

  return Array.from(tagCategories.entries())
    .reduce((acc: Filter[], [category, values]) => {
      const items: FilterItem[] = Array.from(values.entries())
        .map(([label, count]) => ({
          label,
          count,
          id: label,
        }))
        .sort((a, b) =>
          a.label.localeCompare(b.label, undefined, { numeric: true }),
        )

      const filters: Filter[] = [
        ...acc,
        {
          items,
          id: category,
          label: category,
        },
      ]

      return filters
    }, [])
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { numeric: true }),
    )
}
