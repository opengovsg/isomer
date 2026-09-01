import type {
  DateFilterCard,
  DateFilterDisplayEntry,
  DateFilterValue,
} from "~/interfaces/internal/CollectionCard"
import type { ArticlePagePageProps, CollectionPagePageProps } from "~/types"
import { format, isSameDay, parseISO } from "date-fns"
import { isDateFilter } from "~/types/page"

import { getDateFilterStatus, getTodayInSingapore } from "./getDateFilterStatus"

interface GetDateFilterValuesResult {
  dateTagged: DateFilterValue[] | undefined
  dateFilterCards: DateFilterCard[] | undefined
}

// Validates `dateTagged` against the parent's `tagCategories`, dropping
// orphaned entries. Safe to run server-side — no status computation.
export const getValidatedDateTagged = (
  itemDateTagged: ArticlePagePageProps["dateTagged"],
  tagCategories: CollectionPagePageProps["tagCategories"],
): DateFilterValue[] | undefined => {
  return getDateFilterStaticEntries(itemDateTagged, tagCategories)?.map(
    ({ id, date, endDate }) => ({ id, date, endDate }),
  )
}

// "27 Sep - 29 Sep 2026" when the range stays within one year (year shown
// once, at the end); "27 Jul 2025 - 25 Oct 2026" when it crosses years (year
// shown on both sides); "15 Jan 2026" for a single date (also used when
// endDate is the same day as date, since the range is degenerate).
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

// Server-safe: label + formatted date text only — no status computation.
export const getDateFilterStaticEntries = (
  itemDateTagged: ArticlePagePageProps["dateTagged"],
  tagCategories: CollectionPagePageProps["tagCategories"],
): DateFilterDisplayEntry[] | undefined => {
  if (!itemDateTagged || itemDateTagged.length === 0 || !tagCategories) {
    return undefined
  }

  const dateCategories = tagCategories.filter(isDateFilter)
  const entries: DateFilterDisplayEntry[] = []

  itemDateTagged.forEach((value) => {
    const category = dateCategories.find(
      (tagCategory) => tagCategory.id === value.id,
    )
    if (!category) {
      return
    }

    entries.push({
      id: category.id,
      label: category.label,
      dateText: formatDateFilterDateText(value.date, value.endDate),
      date: value.date,
      endDate: value.endDate,
    })
  })

  return entries.length > 0 ? entries : undefined
}

// NOTE: used by tests and any callers that need the full resolved shape in
// one shot. Production UI should prefer getDateFilterStaticEntries (server)
// + EventDateFilterDisplay (client) instead.
export const getDateFilterValues = (
  itemDateTagged: ArticlePagePageProps["dateTagged"],
  tagCategories: CollectionPagePageProps["tagCategories"],
  today: string = getTodayInSingapore(),
): GetDateFilterValuesResult => {
  const entries = getDateFilterStaticEntries(itemDateTagged, tagCategories)

  if (!entries) {
    return { dateTagged: undefined, dateFilterCards: undefined }
  }

  const dateCategories = tagCategories?.filter(isDateFilter) ?? []
  const dateTagged: DateFilterValue[] = entries.map(
    ({ id, date, endDate }) => ({ id, date, endDate }),
  )
  const dateFilterCards: DateFilterCard[] = entries.map((entry) => {
    const category = dateCategories.find(
      (tagCategory) => tagCategory.id === entry.id,
    )
    const status = getDateFilterStatus(entry, today)
    const statusLabel =
      category?.statusLabels.find(({ id }) => id === status)?.label ?? status

    return { ...entry, status, statusLabel }
  })

  return {
    dateTagged,
    dateFilterCards,
  }
}
