import type { CollectionPageCategoryLabel } from "~/types/page"

export const DEFAULT_CATEGORY_FILTER_LABEL = "Category"

export const resolveCategoryFilterLabel = (
  categoryLabel?: CollectionPageCategoryLabel,
) => categoryLabel?.trim() || DEFAULT_CATEGORY_FILTER_LABEL
