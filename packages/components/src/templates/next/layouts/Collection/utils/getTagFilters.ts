import type { Filter, FilterItem } from "../../../types/Filter"
import type { ProcessedCollectionCardProps } from "~/interfaces"

export const getTagFilters = (
  items: ProcessedCollectionCardProps[],
): Filter[] => {
  // NOTE: Each tag is a mapping of a category to its
  // associated set of values as well as the selected value.
  // Hence, we store a map here of the category (eg: Body parts)
  // to the number of occurences of each value (eg: { Brain: 3, Leg: 2})
  const tagCategories: Record<string, Record<string, number>> = {}

  items.forEach(({ tags }) => {
    if (tags) {
      tags.forEach(({ selected: selectedLabels, category }) => {
        selectedLabels.forEach((label) => {
          if (!tagCategories[category]) {
            tagCategories[category] = {}
          }
          if (!tagCategories[category][label]) {
            tagCategories[category][label] = 0
          }

          tagCategories[category][label] += 1
        })
      })
    }
  })

  return Object.entries(tagCategories).reduce((acc: Filter[], curValue) => {
    const [category, values] = curValue
    const items: FilterItem[] = Object.entries(values).map(
      ([label, count]) => ({
        label,
        count,
        id: label,
      }),
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
}
