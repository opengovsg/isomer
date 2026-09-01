import type {
  DateFilterCard,
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
  return getDateFilterValues(itemDateTagged, tagCategories).dateTagged
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

// NOTE: Shared by getCollectionItems (server) and client-side enrichment —
// resolves an item's raw `dateTagged` against the parent's `tagCategories`.
// Status (`dateFilterCards`) should only be consumed on the client so it
// reflects today's Singapore date at view time.
export const getDateFilterValues = (
  itemDateTagged: ArticlePagePageProps["dateTagged"],
  tagCategories: CollectionPagePageProps["tagCategories"],
  today: string = getTodayInSingapore(),
): GetDateFilterValuesResult => {
  if (!itemDateTagged || itemDateTagged.length === 0 || !tagCategories) {
    return { dateTagged: undefined, dateFilterCards: undefined }
  }

  const dateCategories = tagCategories.filter(isDateFilter)

  const dateTagged: DateFilterValue[] = []
  const dateFilterCards: DateFilterCard[] = []

  itemDateTagged.forEach((value) => {
    const category = dateCategories.find(
      (tagCategory) => tagCategory.id === value.id,
    )
    // NOTE: the owning filter no longer exists (deleted) — orphaned entry,
    // ignored at render rather than erroring (see wayfinder ticket 008).
    if (!category) {
      return
    }

    dateTagged.push(value)

    const status = getDateFilterStatus(value, today)
    const statusLabel =
      category.statusLabels.find(({ id }) => id === status)?.label ?? status

    dateFilterCards.push({
      id: category.id,
      label: category.label,
      status,
      statusLabel,
      dateText: formatDateFilterDateText(value.date, value.endDate),
    })
  })

  return {
    dateTagged: dateTagged.length > 0 ? dateTagged : undefined,
    dateFilterCards: dateFilterCards.length > 0 ? dateFilterCards : undefined,
  }
}
