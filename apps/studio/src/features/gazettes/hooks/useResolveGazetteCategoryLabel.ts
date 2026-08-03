import { useToast } from "@opengovsg/design-system-react"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"

import { useGazetteSubcategoriesContext } from "../contexts/GazetteSubcategoriesContext"

/**
 * Resolves a gazette category uuid to its human-readable label via the
 * collection's tagCategories, surfacing a toast and returning `undefined`
 * when the id can't be resolved (e.g. stale tagCategories after the
 * collection's options changed underneath an open form).
 *
 * Shared by CreateGazetteModal and ModifyGazetteModal, which both need to
 * resolve the submitted categoryId to a categoryLabel before calling the
 * upload/create/update mutations.
 */
export const useResolveGazetteCategoryLabel = (): ((
  categoryId: string,
) => string | undefined) => {
  const { categoryMap } = useGazetteSubcategoriesContext()
  const toast = useToast()

  return (categoryId: string) => {
    const categoryLabel = categoryMap[categoryId]
    if (!categoryLabel) {
      toast({
        status: "error",
        title: "Unable to resolve category — please refresh and try again",
        ...BRIEF_TOAST_SETTINGS,
      })
    }
    return categoryLabel
  }
}
