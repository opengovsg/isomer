import type { PropsWithChildren } from "react"
import { filter } from "lodash-es"
import { createContext, useContext, useMemo } from "react"
import { trpc } from "~/utils/trpc"

import type { GazettesCategory } from "../types"
import { GAZETTE_SUBCATEGORY_LABEL,
  governmentGazetteSubcategoriesKeys,
  legislativeSupplementsSubcategoriesKeys,
  otherSupplementsSubcategoriesKeys } from "../constants"

interface GazetteSubcategoriesContextValue {
  subcategories: { label: string; value: string }[]
  subcategoryMap: Record<string, string>
  getSubcategoriesForCategory: (category: GazettesCategory) => {
    label: string
    value: string
  }[]
}

const GazetteSubcategoriesContext =
  createContext<GazetteSubcategoriesContextValue | null>(null)

interface GazetteSubcategoriesProviderProps {
  siteId: number
  gazettesCollectionId: number
}

export const GazetteSubcategoriesProvider = ({
  children,
  siteId,
  gazettesCollectionId,
}: PropsWithChildren<GazetteSubcategoriesProviderProps>) => {
  const [tagCategories] = trpc.collection.getCollectionTags.useSuspenseQuery({
    collectionId: gazettesCollectionId,
    siteId,
  })

  const value = useMemo(() => {
    const subcategoryCategory = tagCategories?.find(
      (cat) => cat.label === GAZETTE_SUBCATEGORY_LABEL,
    )

    const subcategories =
      subcategoryCategory?.options?.map((option) => ({
        label: option.label,
        value: option.id,
      })) ?? []

    // SAFETY: subcategory labels are keyed by their stable option ids
    const subcategoryMap = Object.fromEntries(
      subcategories.map(({ value, label }) => [value, label]),
    ) as Record<string, string>

    const getSubcategoriesForCategory = (category: GazettesCategory) => {
      switch (category) {
        case "Government Gazette": {
          return filter(subcategories, ({ label }) => 
            governmentGazetteSubcategoriesKeys.some(
              (key) => key === label,
            )
          )
        }
        case "Other Supplements": {
          return filter(subcategories, ({ label }) => 
            otherSupplementsSubcategoriesKeys.some(
              (key) => key === label,
            )
          )
        }

        case "Legislative Supplements": {
          return filter(subcategories, ({ label }) => 
            legislativeSupplementsSubcategoriesKeys.some(
              (key) => key === label,
            )
          )
        }
      }
    }
    return { getSubcategoriesForCategory, subcategories, subcategoryMap }
  }, [tagCategories])

  return (
    <GazetteSubcategoriesContext.Provider value={value}>
      {children}
    </GazetteSubcategoriesContext.Provider>
  )
}

export const useGazetteSubcategoriesContext =
  (): GazetteSubcategoriesContextValue => {
    const context = useContext(GazetteSubcategoriesContext)
    if (!context) {
      throw new Error(
        "useGazetteSubcategoriesContext must be used within GazetteSubcategoriesProvider",
      )
    }
    return context
  }
