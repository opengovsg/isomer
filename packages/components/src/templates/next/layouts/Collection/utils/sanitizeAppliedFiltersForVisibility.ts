import type { CollectionPagePageProps } from "~/types"
import { DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY } from "~/types/constants"
import { isDateFilter } from "~/types/page"

import type { AppliedFilter } from "../../../types/Filter"

export const sanitizeAppliedFiltersForVisibility = (
  appliedFilters: AppliedFilter[],
  tagCategories?: CollectionPagePageProps["tagCategories"],
): AppliedFilter[] => {
  if (!tagCategories?.length) {
    return appliedFilters
  }

  return appliedFilters.flatMap((appliedFilter) => {
    const matchedCategory = tagCategories.find(
      (tagCategory) => tagCategory.id === appliedFilter.id,
    )

    if (!matchedCategory || !isDateFilter(matchedCategory)) {
      return [appliedFilter]
    }

    const category = matchedCategory

    const showStatusLabelsFilter =
      category.showStatusLabelsFilter ??
      DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showStatusLabelsFilter
    const showDateRangeFilter =
      category.showDateRangeFilter ??
      DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showDateRangeFilter

    const items = showStatusLabelsFilter ? appliedFilter.items : []
    const dateRange = showDateRangeFilter ? appliedFilter.dateRange : undefined

    if (items.length === 0 && !dateRange) {
      return []
    }

    return [{ ...appliedFilter, items, dateRange }]
  })
}
