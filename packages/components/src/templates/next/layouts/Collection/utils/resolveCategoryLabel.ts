const CATEGORY_OTHERS = "Others"

export interface ResolveCategoryLabelProps {
  category?: string
}

export const resolveCategoryLabel = ({
  category,
}: ResolveCategoryLabelProps): string => {
  return category ?? CATEGORY_OTHERS
}
