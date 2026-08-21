import {
  DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY,
  TAG_CATEGORY_TYPE,
} from "~/types/constants"

import type { Filter } from "../../../types/Filter"

export const isDateFilterAvailable = (filter: Filter): boolean => {
  if (filter.type !== TAG_CATEGORY_TYPE.Date) {
    return false
  }

  const showStatusLabels =
    filter.showStatusLabels ??
    DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showStatusLabels
  const showDateRange =
    filter.showDateRange ?? DEFAULT_DATE_FILTER_SIDEBAR_VISIBILITY.showDateRange

  if (!showStatusLabels && !showDateRange) {
    return false
  }

  if (showStatusLabels && filter.items.length >= 1) {
    return true
  }

  return showDateRange
}

export const isAvailableFilter = (filter: Filter): boolean => {
  if (filter.type === TAG_CATEGORY_TYPE.Date) {
    return isDateFilterAvailable(filter)
  }

  return filter.items.length >= 1
}
