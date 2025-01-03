import type { Filter } from "../../../types/Filter"
import { FILTER_ID_CATEGORY } from "./constants"

// use filters generated as the single source of truth
export const shouldShowCategory = (filters: Filter[]): boolean => {
  return filters.some((filter) => filter.id === FILTER_ID_CATEGORY)
}
