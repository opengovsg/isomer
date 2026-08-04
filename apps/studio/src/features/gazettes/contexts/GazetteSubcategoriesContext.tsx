import type { PropsWithChildren } from "react"
import { createContext, useContext, useMemo } from "react"
import { trpc } from "~/utils/trpc"

import {
  GAZETTE_CATEGORY_LABEL,
  GAZETTE_SUBCATEGORY_LABEL,
  getAllowedSubcategoryLabelsForCategory,
} from "../constants"

interface GazetteSubcategoriesContextValue {
  categories: { label: string; value: string }[]
  categoryMap: Record<string, string>
  subcategories: { label: string; value: string }[]
  subcategoryMap: Record<string, string>
  /**
   * `categoryLabel` is the resolved label for the selected category id, or
   * `undefined` when the id is not one of this collection's Category options.
   * Callers must not pass an unresolved id through here. That would return an
   * empty list and make the dropdown look broken when the real problem is the
   * category itself.
   */
  getSubcategoriesForCategory: (categoryLabel: string | undefined) => {
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
    siteId,
    collectionId: gazettesCollectionId,
  })

  const value = useMemo(() => {
    const categoryCategory = tagCategories?.find(
      (cat) => cat.label === GAZETTE_CATEGORY_LABEL,
    )
    const subcategoryCategory = tagCategories?.find(
      (cat) => cat.label === GAZETTE_SUBCATEGORY_LABEL,
    )

    const categories =
      categoryCategory?.options?.map((option) => ({
        label: option.label,
        value: option.id,
      })) ?? []

    const categoryMap = Object.fromEntries(
      categories.map(({ value, label }) => [value, label]),
    ) as Record<string, string>

    const subcategories =
      subcategoryCategory?.options?.map((option) => ({
        label: option.label,
        value: option.id,
      })) ?? []

    const subcategoryMap = Object.fromEntries(
      subcategories.map(({ value, label }) => [value, label]),
    ) as Record<string, string>

    const getSubcategoriesForCategory = (categoryLabel: string | undefined) => {
      if (!categoryLabel) return []
      const allowedLabels = new Set(
        getAllowedSubcategoryLabelsForCategory(categoryLabel),
      )
      return subcategories.filter(({ label }) => allowedLabels.has(label))
    }
    return {
      categories,
      categoryMap,
      subcategories,
      subcategoryMap,
      getSubcategoriesForCategory,
    }
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
