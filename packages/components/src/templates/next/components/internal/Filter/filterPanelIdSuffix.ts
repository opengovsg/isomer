/** Suffix for filter panel DOM ids. `filter.id` may be a category label with spaces. */
// No spaces: the suffix is used in HTML `id` and `aria-controls`, which must not contain whitespace.
export const getFilterPanelIdSuffix = (filterId: string): string =>
  filterId.trim().replace(/\s+/g, "-")
