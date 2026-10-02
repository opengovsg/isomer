/** Suffix for filter panel DOM ids. `filter.id` may be a category label with spaces. */
export const getFilterPanelIdSuffix = (filterId: string): string =>
  filterId.trim().replace(/\s+/g, "-")
