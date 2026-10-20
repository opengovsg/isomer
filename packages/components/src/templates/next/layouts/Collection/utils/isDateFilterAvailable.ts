import {
  DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY,
  TAG_CATEGORY_TYPE,
} from "~/types/constants"

import type { Filter } from "../../../types/Filter"

export const isDateFilterAvailable = (filter: Filter): boolean => {
  if (filter.type !== TAG_CATEGORY_TYPE.Date) {
    return false
  }

  const showStatusLabelsFilter =
    filter.showStatusLabelsFilter ??
    DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showStatusLabelsFilter
  const showDateRangeFilter =
    filter.showDateRangeFilter ??
    DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showDateRangeFilter

  if (!showStatusLabelsFilter && !showDateRangeFilter) {
    return false
  }

  if (showStatusLabelsFilter && filter.items.length >= 1) {
    return true
  }

  return showDateRangeFilter && (filter.dateTaggedItemCount ?? 0) >= 1
}

export const isAvailableFilter = (filter: Filter): boolean => {
  if (filter.type === TAG_CATEGORY_TYPE.Date) {
    return isDateFilterAvailable(filter)
  }

  return filter.items.length >= 1
}
