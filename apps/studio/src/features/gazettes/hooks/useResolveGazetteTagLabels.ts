import { useToast } from "@opengovsg/design-system-react"
import { BRIEF_TOAST_SETTINGS } from "~/constants/toast"

import { useGazetteSubcategoriesContext } from "../contexts/GazetteSubcategoriesContext"

interface GazetteTagLabels {
  categoryLabel: string
  subcategoryLabel: string
}

/**
 * Resolve category and subcategory ids to labels from the collection taxonomy.
 *
 * Returns `undefined` and shows a toast when either id no longer exists in the
 * current options. Create and modify flows both need the resolved labels for
 * the server validation step and for the `{year}/{category}/{subcategory}/{file}`
 * S3 key.
 *
 * Do not fall back to raw uuids here. That would write an S3 key the ingestion
 * job cannot map back to the taxonomy.
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
          "Unable to resolve category or subcategory. Refresh and try again.",
        ...BRIEF_TOAST_SETTINGS,
      })
      return undefined
    }

    return { categoryLabel, subcategoryLabel }
  }
}
