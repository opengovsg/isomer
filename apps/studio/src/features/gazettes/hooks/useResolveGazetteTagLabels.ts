import { useToast } from "@opengovsg/design-system-react"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"

import { useGazetteSubcategoriesContext } from "../contexts/GazetteSubcategoriesContext"

interface GazetteTagLabels {
  categoryLabel: string
  subcategoryLabel: string
}

/**
 * Resolves a gazette's category and subcategory uuids to their human-readable
 * labels via the collection's tagCategories, surfacing a toast and returning
 * `undefined` when either id can't be resolved (e.g. stale tagCategories after
 * the collection's options changed underneath an open form).
 *
 * Shared by CreateGazetteModal and ModifyGazetteModal, which both need labels
 * for two things: the `categoryLabel` the server cross-checks against
 * `categoryId`, and the `{year}/{category}/{subcategory}/{file}` S3 key.
 *
 * Resolve-or-abort, deliberately — falling back to the raw uuid would write an
 * S3 key that doesn't match the taxonomy and can't be read back by the
 * ingestion job's ref parsing.
 */
export const useResolveGazetteTagLabels = (): ((args: {
  categoryId: string
  subcategoryId: string
}) => GazetteTagLabels | undefined) => {
  const { categoryMap, subcategoryMap } = useGazetteSubcategoriesContext()
  const toast = useToast()

  return ({ categoryId, subcategoryId }) => {
    const categoryLabel = categoryMap[categoryId]
    const subcategoryLabel = subcategoryMap[subcategoryId]

    if (!categoryLabel || !subcategoryLabel) {
      toast({
        status: "error",
        title:
          "Unable to resolve category or subcategory — please refresh and try again",
        ...BRIEF_TOAST_SETTINGS,
      })
      return undefined
    }

    return { categoryLabel, subcategoryLabel }
  }
}
