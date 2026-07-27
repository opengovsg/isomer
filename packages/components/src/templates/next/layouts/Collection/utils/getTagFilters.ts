import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { resolveTagCategoryDisplay } from "~/types/constants"

import type { Filter, FilterItem } from "../../../types/Filter"

export const getTagFilters = (
  items: ProcessedCollectionCardProps[],
  tagCategories?: CollectionPageSchemaType["page"]["tagCategories"],
): Filter[] => {
  // NOTE: Each tag is a mapping of a category to its
  // associated set of values as well as the selected value.
  // Hence, we store a map here of the category (eg: Body parts)
  // to the number of occurences of each value (eg: { Brain: 3, Leg: 2 })
  //
  // NOTE: Tag category `display` (pills vs plaintext) is attached to each
  // Filter below for consumers that need it, but the sidebar itself always
  // renders checkboxes regardless of `display` — that value only changes
  // card/article tag rendering (PillTags / PlaintextTags).
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

  const filters = Array.from(tagCategoryLabels.entries()).map(
    ([category, values]) => {
      const items: FilterItem[] = Array.from(values.entries()).map(
        ([label, count]) => ({
          label,
          count,
          id: label,
        }),
      )

      const matchedCategory = tagCategories?.find(
        (tagCategory) => tagCategory.label === category,
      )

      return {
        items,
        id: category,
        label: category,
        display: resolveTagCategoryDisplay(matchedCategory?.display),
      }
    },
  )

  if (!tagCategories || tagCategories.length === 0) {
    return filters
  }

  const tagCategoryIds = tagCategories.map(({ label }) => label)

  const sortedFilters = filters.sort((a, b) => {
    const indexA = tagCategoryIds.indexOf(a.id)
    const indexB = tagCategoryIds.indexOf(b.id)

    if (indexA === -1 && indexB === -1) return 0
    if (indexA === -1) return 1
    if (indexB === -1) return -1

    return indexA - indexB
  })

  return sortedFilters.map((filter) => {
    const category = tagCategories.find((cat) => cat.label === filter.id)
    const tagOptionLabels =
      category?.options?.map((option) => option.label) ?? []

    return {
      ...filter,
      items: filter.items.sort(
        (a, b) => tagOptionLabels.indexOf(a.id) - tagOptionLabels.indexOf(b.id),
      ),
    }
  })
}
