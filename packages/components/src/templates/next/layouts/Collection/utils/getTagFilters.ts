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
      tags.forEach(({ selected: selectedLabels, label }) => {
        if (!tagCategoryLabels.has(label)) {
          tagCategoryLabels.set(label, new Map())
        }
        const categoryMap = tagCategoryLabels.get(label) ?? new Map()
        selectedLabels.forEach((optionLabel) => {
          if (!categoryMap.has(optionLabel)) {
            categoryMap.set(optionLabel, 0)
          }
          categoryMap.set(optionLabel, (categoryMap.get(optionLabel) ?? 0) + 1)
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

  const tagCategoryLabelOrder = new Map(
    tagCategories.map(({ label }, index) => [label, index]),
  )

  const sortedFilters = filters.sort((a, b) => {
    const indexA = tagCategoryLabelOrder.get(a.id) ?? Infinity
    const indexB = tagCategoryLabelOrder.get(b.id) ?? Infinity
    return indexA - indexB
  })

  return sortedFilters.map((filter) => {
    const category = tagCategories.find((cat) => cat.label === filter.id)
    const tagOptionLabelOrder = new Map(
      category?.options?.map((option, index) => [option.label, index]) ?? [],
    )

    return {
      ...filter,
      items: filter.items.sort((a, b) => {
        const indexA = tagOptionLabelOrder.get(a.id) ?? Infinity
        const indexB = tagOptionLabelOrder.get(b.id) ?? Infinity
        return indexA - indexB
      }),
    }
  })
}
