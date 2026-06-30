import type { CollectionPageCategoryOption } from "~/types/page"

const CATEGORY_OTHERS = "Others"

export interface ResolveCategoryLabelProps {
  categoryId?: string
  category?: string
  categoryOptions?: CollectionPageCategoryOption[]
}

export const resolveCategoryLabel = ({
  categoryId,
  category,
  categoryOptions,
}: ResolveCategoryLabelProps): string => {
  if (categoryId && categoryOptions) {
    return (
      categoryOptions.find((opt) => opt.id === categoryId)?.label ??
      category ??
      CATEGORY_OTHERS
    )
  }

  return category ?? CATEGORY_OTHERS
}
