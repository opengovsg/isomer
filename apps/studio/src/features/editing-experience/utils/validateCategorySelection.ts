export const CATEGORY_SELECTION_ERROR_MESSAGE = "Please select an option."

export function isCategorySelectionValid({
  hasConfigurableOptions,
  categoryId,
  category,
  useCategoryId,
}: {
  hasConfigurableOptions: boolean
  categoryId?: string
  category?: string
  useCategoryId: boolean
}): boolean {
  if (!hasConfigurableOptions) {
    return true
  }

  if (useCategoryId) {
    return !!categoryId?.trim()
  }

  return !!category?.trim()
}
