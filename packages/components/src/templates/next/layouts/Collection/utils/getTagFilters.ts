import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { resolveTagCategoryDisplay } from "~/types/constants"

import type { Filter, FilterItem } from "../../../types/Filter"

const incrementTagCount = (
  tagCategoryLabels: Map<string, Map<string, number>>,
  category: string,
  label: string,
) => {
  if (!tagCategoryLabels.has(category)) {
    tagCategoryLabels.set(category, new Map())
  }

  const categoryMap = tagCategoryLabels.get(category) ?? new Map()
  if (!categoryMap.has(label)) {
    categoryMap.set(label, 0)
  }
  categoryMap.set(label, (categoryMap.get(label) ?? 0) + 1)
}

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

  for (const { tags } of items) {
    if (tags === undefined) {
      continue
    }

    for (const { selected: selectedLabels, category } of tags) {
      for (const label of selectedLabels) {
        incrementTagCount(tagCategoryLabels, category, label)
      }
    }
  }

  const filters: Filter[] = []

  for (const [category, values] of tagCategoryLabels.entries()) {
    const filterItems: FilterItem[] = [...values.entries()].map(
      ([label, count]) => ({
        count,
        id: label,
        label,
      }),
    )

    const matchedCategory = tagCategories?.find(
      (tagCategory) => tagCategory.label === category,
    )

    filters.push({
      display: resolveTagCategoryDisplay(matchedCategory?.display),
      id: category,
      items: filterItems,
      label: category,
    })
  }

  if (tagCategories === undefined || tagCategories.length === 0) {
    return filters
  }

  const tagCategoryIds = tagCategories.map(({ label }) => label)

  const sortedFilters = filters.sort((a, b) => {
    // NOTE: the label of the filter is the id
    const indexA = tagCategoryIds.indexOf(a.id)
    const indexB = tagCategoryIds.indexOf(b.id)

    if (indexA === -1 && indexB === -1) {
      return 0
    }
    if (indexA === -1) {
      return 1
    }
    if (indexB === -1) {
      return -1
    }

    return indexA - indexB
  })

  return sortedFilters.map((filter) => {
    const category = tagCategories.find((cat) => cat.label === filter.id)
    const tagOptionIds = category?.options?.map((option) => option.label) ?? []

    return {
      ...filter,
      items: filter.items.sort(
        (a, b) => tagOptionIds.indexOf(a.id) - tagOptionIds.indexOf(b.id),
      ),
    }
  })
}
