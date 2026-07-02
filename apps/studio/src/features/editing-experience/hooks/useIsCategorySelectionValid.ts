import { useFeatureValue } from "@growthbook/growthbook-react"
import {
  CATEGORY_DROPDOWN_FEATURE_KEY,
  CATEGORY_ID_DROPDOWN_FEATURE_KEY,
} from "~/lib/growthbook"
import { trpc } from "~/utils/trpc"

import { isCategorySelectionValid } from "../utils/validateCategorySelection"

export function useIsCategorySelectionValid({
  resourceId,
  siteId,
  categoryId,
  category,
  enabled,
}: {
  resourceId: number
  siteId: number
  categoryId?: string
  category?: string
  enabled: boolean
}): boolean {
  const { enabledSites: categoryIdEnabledSites } = useFeatureValue<{
    enabledSites: string[]
  }>(CATEGORY_ID_DROPDOWN_FEATURE_KEY, { enabledSites: [] })
  const { enabledSites: categoryDropdownEnabledSites } = useFeatureValue<{
    enabledSites: string[]
  }>(CATEGORY_DROPDOWN_FEATURE_KEY, { enabledSites: [] })

  const useCategoryId = categoryIdEnabledSites.includes(siteId.toString())
  const useLegacyDropdown =
    !useCategoryId && categoryDropdownEnabledSites.includes(siteId.toString())
  const shouldValidate = enabled && (useCategoryId || useLegacyDropdown)

  const { data: categoryOptionsData, isLoading: isCategoryOptionsLoading } =
    trpc.page.getCategoryOptions.useQuery(
      { siteId, pageId: resourceId },
      { enabled: shouldValidate && useCategoryId },
    )

  const { data: categoriesData, isLoading: isCategoriesLoading } =
    trpc.page.getCategories.useQuery(
      { siteId, pageId: resourceId },
      { enabled: shouldValidate && useLegacyDropdown },
    )

  if (!shouldValidate) {
    return true
  }

  if (
    (useCategoryId && isCategoryOptionsLoading) ||
    (useLegacyDropdown && isCategoriesLoading)
  ) {
    return false
  }

  if (useCategoryId) {
    return isCategorySelectionValid({
      hasConfigurableOptions:
        (categoryOptionsData?.categoryOptions.length ?? 0) > 0,
      categoryId,
      useCategoryId: true,
    })
  }

  return isCategorySelectionValid({
    hasConfigurableOptions: (categoriesData?.categories.length ?? 0) > 0,
    category,
    useCategoryId: false,
  })
}
