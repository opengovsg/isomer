"use client"

import type { ArticlePagePageProps, CollectionPagePageProps } from "~/types"
import { useMemo } from "react"

import { getDateFilterValues } from "../../../layouts/Collection/utils/getDateFilterValues"

export const useDateFilterCards = (
  dateTagged: ArticlePagePageProps["dateTagged"],
  tagCategories: CollectionPagePageProps["tagCategories"],
) => {
  return useMemo(
    () => getDateFilterValues(dateTagged, tagCategories).dateFilterCards,
    [dateTagged, tagCategories],
  )
}
