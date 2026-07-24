import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPageSchemaType } from "~/types"
import { resolveTagCategoryDisplay } from "~/types/constants"

import type { Filter, FilterItem } from "../../../types/Filter"
import { tagGroupMatchesFilterCategory } from "./buildTagGroupsFromTagged"

export const getTagFilters = (
  items: ProcessedCollectionCardProps[],
  tagCategories?: CollectionPageSchemaType["page"]["tagCategories"],
): Filter[] => {
  // NOTE: Each tag is a mapping of a category to its
  // associated set of values as well as the selected value.
  // Hence, we store a map here of the category id (stable uuid)
  // to the number of occurences of each value (eg: { Brain: 3, Leg: 2 })
  //
  // NOTE: Tag category `display` (pills vs plaintext) is not attached to
  // Filter objects. The sidebar always uses checkboxes; `display` is consumed
  // by card/article tag rendering (PillTags / PlaintextTags) from tagCategories.
  const tagCategoryCounts = new Map<string, Map<string, number>>()

  items.forEach(({ tags }) => {
    if (tags) {
      tags.forEach(({ id, selected: selectedLabels, category }) => {
        const categoryKey = id ?? category
        if (!tagCategoryCounts.has(categoryKey)) {
          tagCategoryCounts.set(categoryKey, new Map())
        }
        const categoryMap = tagCategoryCounts.get(categoryKey) ?? new Map()
        selectedLabels.forEach((label) => {
          if (!categoryMap.has(label)) {
            categoryMap.set(label, 0)
          }
          categoryMap.set(label, (categoryMap.get(label) ?? 0) + 1)
        })
      })
    }
  })

  const filters = Array.from(tagCategoryCounts.entries()).reduce(
    (acc: Filter[], [categoryKey, values]) => {
      const items: FilterItem[] = Array.from(values.entries()).map(
        ([label, count]) => ({
          label,
          count,
          id: label,
        }),
      )

      const matchedCategory = tagCategories?.find(
        (tagCategory) =>
          tagCategory.id === categoryKey || tagCategory.label === categoryKey,
      )

      const filters: Filter[] = [
        ...acc,
        {
          items,
          id: matchedCategory?.id ?? categoryKey,
          label: matchedCategory?.label ?? categoryKey,
          display: resolveTagCategoryDisplay(matchedCategory?.display),
        },
      ]

      return filters
    },
    [],
  )

  if (!tagCategories || tagCategories.length === 0) {
    return filters
  }

  const tagCategoryIds = tagCategories.map(({ id }) => id)

  const sortedFilters = tagCategoryIds
    ? filters.sort((a, b) => {
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
        const category = tagCategories.find(
          (cat) => cat.id === filter.id || cat.label === filter.id,
        )
        const tagOptionIds =
          category?.options?.map((option) => option.label) ?? []
        return tagOptionIds.indexOf(a.id) - tagOptionIds.indexOf(b.id)
      }),
    }
  })
}
