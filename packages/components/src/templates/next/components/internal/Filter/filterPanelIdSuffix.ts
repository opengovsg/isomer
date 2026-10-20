/** Suffix for filter panel DOM ids. `filter.id` may be a category label with spaces. */
// No spaces: the suffix is used in HTML `id` and `aria-controls`, which must not contain whitespace.
// Percent-encode the full label so distinct ids (e.g. `A B` vs `A-B`) never share a panel id.
export const getFilterPanelIdSuffix = (filterId: string): string =>
  encodeURIComponent(filterId.trim())
