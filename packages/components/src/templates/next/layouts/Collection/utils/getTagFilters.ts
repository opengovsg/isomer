import type { Filter, FilterItem } from "../../../types/Filter"
import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"

export const getTagFilters = (
  items: ProcessedCollectionCardProps[],
  tagCategories?: CollectionPageSchemaType["page"]["tagCategories"],
): Filter[] => {
  // NOTE: Each tag is a mapping of a category to its
  // associated set of values as well as the selected value.
  // Hence, we store a map here of the category (eg: Body parts)
  // to the number of occurences of each value (eg: { Brain: 3, Leg: 2 })
  const tagCategoryLabels = new Map<string, Map<string, number>>()

  items.forEach(({ tags }) => {
    if (tags) {
      tags.forEach(({ selected: selectedLabels, category }) => {
        if (!tagCategoryLabels.has(category)) {
          tagCategoryLabels.set(category, new Map())
        }
        const categoryMap = tagCategoryLabels.get(category) ?? new Map()
        selectedLabels.forEach((label) => {
          if (!categoryMap.has(label)) {
            categoryMap.set(label, 0)
          }
          categoryMap.set(label, (categoryMap.get(label) ?? 0) + 1)
        })
      })
    }
  })

  const filters = Array.from(tagCategoryLabels.entries()).reduce(
    (acc: Filter[], [category, values]) => {
      const items: FilterItem[] = Array.from(values.entries()).map(
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
    },
    [],
  )

  if (!tagCategories || tagCategories.length === 0) {
    return filters
  }

  const tagCategoryIds = tagCategories.map(({ label }) => label)

  const sortedFilters = tagCategoryIds
    ? filters.sort((a, b) => {
        // NOTE: the label of the filter is the id
        const indexA = tagCategoryIds.indexOf(a.id)
        const indexB = tagCategoryIds.indexOf(b.id)

        if (indexA === -1 && indexB === -1) return 0
        if (indexA === -1) return 1
        if (indexB === -1) return -1

        return indexA - indexB
      })
    : filters

  return sortedFilters.map((filter) => {
    return {
      ...filter,
      items: filter.items.sort((a, b) => {
        const category = tagCategories.find((cat) => cat.label === filter.id)
        const tagOptionIds =
          category?.options?.map((option) => option.label) ?? []
        return tagOptionIds.indexOf(a.id) - tagOptionIds.indexOf(b.id)
      }),
    }
  })
}
