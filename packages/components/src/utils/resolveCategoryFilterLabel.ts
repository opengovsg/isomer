export const DEFAULT_CATEGORY_FILTER_LABEL = "Category"

export const resolveCategoryFilterLabel = (categoryLabel?: string) =>
  categoryLabel?.trim() || DEFAULT_CATEGORY_FILTER_LABEL
