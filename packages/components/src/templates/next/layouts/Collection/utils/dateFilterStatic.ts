import type {
  DateFilterDisplayEntry,
  DateFilterValue,
} from "~/interfaces/internal/CollectionCard"
import type { ArticlePagePageProps, CollectionPagePageProps } from "~/types"
import { format, isSameDay, parseISO } from "date-fns"
import { isDateFilter } from "~/types/page"

export interface ResolvedItemDateFields {
  dateTagged?: DateFilterValue[]
  dateFilterDisplayEntries?: DateFilterDisplayEntry[]
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

export const resolveItemDateFields = (
  itemDateTagged: ArticlePagePageProps["dateTagged"],
  tagCategories: CollectionPagePageProps["tagCategories"],
): ResolvedItemDateFields => {
  if (!itemDateTagged || itemDateTagged.length === 0 || !tagCategories) {
    return {}
  }

  const dateCategories = tagCategories.filter(isDateFilter)
  const dateTagged: DateFilterValue[] = []
  const dateFilterDisplayEntries: DateFilterDisplayEntry[] = []

  itemDateTagged.forEach((value) => {
    const category = dateCategories.find(
      (tagCategory) => tagCategory.id === value.id,
    )
    if (!category) {
      return
    }

    dateTagged.push({
      id: category.id,
      date: value.date,
      endDate: value.endDate,
    })
    dateFilterDisplayEntries.push({
      id: category.id,
      label: category.label,
      dateText: formatDateFilterDateText(value.date, value.endDate),
      date: value.date,
      endDate: value.endDate,
      statusLabels: category.statusLabels,
    })
  })

  if (dateTagged.length === 0) {
    return {}
  }

  return { dateTagged, dateFilterDisplayEntries }
}
