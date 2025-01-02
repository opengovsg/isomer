import type { Filter, FilterItem } from "../../../types/Filter"

export const getTagFilters = ({
  tagCategories,
}: {
  tagCategories: Record<string, Record<string, number>>
}): Filter[] => {
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
