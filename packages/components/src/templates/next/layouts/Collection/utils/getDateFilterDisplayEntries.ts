import type { DateFilterDisplayEntry } from "~/interfaces/internal/DateFilter"
import type { ArticlePagePageProps, CollectionPagePageProps } from "~/types"
import { format, isSameDay, parseISO } from "date-fns"
import { isDateFilter } from "~/types/page"

import { buildDateFilterStatusLabels } from "./buildDateFilterStatusLabels"

interface GetDateFilterDisplayEntriesResult {
  dateFilterDisplayEntries: DateFilterDisplayEntry[] | undefined
}

const formatDateFilterDateText = (
  dateStr: string,
  endDateStr?: string,
): string => {
  const date = parseISO(dateStr)

  if (!endDateStr) {
    return format(date, "d MMM yyyy")
  }

  const endDate = parseISO(endDateStr)

  if (isSameDay(date, endDate)) {
    return format(date, "d MMM yyyy")
  }

  const sameYear = date.getFullYear() === endDate.getFullYear()

  return `${format(date, sameYear ? "d MMM" : "d MMM yyyy")} - ${format(endDate, "d MMM yyyy")}`
}

// NOTE: Shared by getCollectionItems (cards) and Article (article header) so both
// derive display-ready date filter entries from `dateTagged` + `tagCategories`.
export const getDateFilterDisplayEntries = (
  dateTagged: ArticlePagePageProps["dateTagged"],
  tagCategories: CollectionPagePageProps["tagCategories"],
): GetDateFilterDisplayEntriesResult => {
  if (!dateTagged?.length || !tagCategories) {
    return { dateFilterDisplayEntries: undefined }
  }

  const dateCategories = tagCategories.filter(isDateFilter)
  const dateFilterDisplayEntries: DateFilterDisplayEntry[] = []

  dateTagged.forEach((value) => {
    const category = dateCategories.find(({ id }) => id === value.id)
    if (!category) {
      return
    }

    dateFilterDisplayEntries.push({
      id: category.id,
      label: category.label,
      dateText: formatDateFilterDateText(value.date, value.endDate),
      date: value.date,
      endDate: value.endDate,
      statusLabels: buildDateFilterStatusLabels(category.statusLabels),
    })
  })

  if (dateFilterDisplayEntries.length === 0) {
    return { dateFilterDisplayEntries: undefined }
  }

  return { dateFilterDisplayEntries }
}
