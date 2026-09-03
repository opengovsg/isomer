import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPagePageProps } from "~/types"
import { getDateFilterStatus } from "~/templates/next/components/internal/CollectionCard/utils/getDateFilterStatus"
import { isDateFilter } from "~/types/page"
import { getSingaporeDateYYYYMMDD } from "~/utils/getSingaporeDate"

import type { AppliedFilter } from "../../../types/Filter"
import { FILTER_ID_YEAR, NO_SPECIFIED_YEAR_FILTER_ID } from "./constants"
import { normalizeCollectionSearchText } from "./normalizeCollectionSearchText"

export const getFilteredItems = (
  items: ProcessedCollectionCardProps[],
  appliedFilters: AppliedFilter[],
  searchValue: string,
  tagCategories?: CollectionPagePageProps["tagCategories"],
  today: string = getSingaporeDateYYYYMMDD(),
): ProcessedCollectionCardProps[] => {
  const normalizedSearchValue =
    searchValue !== "" ? normalizeCollectionSearchText(searchValue) : ""

  const dateFilterIds = new Set(
    tagCategories?.filter(isDateFilter).map((category) => category.id) ?? [],
  )

  return items.filter((item) => {
    if (
      normalizedSearchValue !== "" &&
      !normalizeCollectionSearchText(item.title).includes(
        normalizedSearchValue,
      ) &&
      !normalizeCollectionSearchText(item.description ?? "").includes(
        normalizedSearchValue,
      )
    ) {
      return false
    }

    const yearFilter = appliedFilters.find(
      (filter) => filter.id === FILTER_ID_YEAR,
    )
    if (
      yearFilter &&
      !yearFilter.items.some((filterItem) =>
        item.date
          ? item.date.getFullYear().toString() === filterItem.id
          : filterItem.id === NO_SPECIFIED_YEAR_FILTER_ID,
      )
    ) {
      return false
    }

    const remainingFilters = appliedFilters.filter(
      ({ id }) => id !== FILTER_ID_YEAR && !dateFilterIds.has(id),
    )

    const matchesTextFilters = remainingFilters
      .map(({ items: activeFilters, id }) => {
        return item.tags?.some(({ category, selected: itemLabels }) => {
          return (
            category === id &&
            activeFilters
              .map(({ id }) => id)
              .reduce((prev, cur) => prev || itemLabels.includes(cur), false)
          )
        })
      })
      .every((x) => x)

    if (!matchesTextFilters) {
      return false
    }

    const dateFilters = appliedFilters.filter(({ id }) => dateFilterIds.has(id))

    return dateFilters.every((appliedFilter) => {
      const value = item.dateTagged?.find(({ id }) => id === appliedFilter.id)
      if (!value) {
        return false
      }

      const matchesBucket =
        appliedFilter.items.length === 0 ||
        appliedFilter.items.some(
          ({ id: statusId }) =>
            getDateFilterStatus({ ...value, today }) === statusId,
        )

      const matchesRange =
        !appliedFilter.dateRange ||
        (value.date <= appliedFilter.dateRange.end &&
          (value.endDate ?? value.date) >= appliedFilter.dateRange.start)

      return matchesBucket && matchesRange
    })
  })
}
