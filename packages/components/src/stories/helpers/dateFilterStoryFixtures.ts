import type { CollectionPagePageProps } from "~/types"
import {
  DATE_FILTER_STATUS_ID,
  DEFAULT_DATE_FILTER_STATUS_LABELS,
  mapDateFilterStatusIds,
  type DateFilterStatusId,
} from "~/types/constants"

export const DATE_FILTER_TAG_CATEGORIES: CollectionPagePageProps["tagCategories"] =
  [
    {
      id: "event-date",
      label: "Event Date",
      type: "date",
      statusLabels: DEFAULT_DATE_FILTER_STATUS_LABELS,
    },
    {
      id: "registration-deadline",
      label: "Registration Deadline",
      type: "date",
      statusLabels: {
        [DATE_FILTER_STATUS_ID.Ended]: "Registration closed",
        [DATE_FILTER_STATUS_ID.Ongoing]: "Registration open",
        [DATE_FILTER_STATUS_ID.Upcoming]: "Registration upcoming",
      } satisfies Record<DateFilterStatusId, string>,
    },
  ]

export const statusLabelsFor = (
  categoryId: string,
): Record<DateFilterStatusId, string> => {
  const category = DATE_FILTER_TAG_CATEGORIES?.find(
    (entry) => entry.id === categoryId,
  )

  if (!category || category.type !== "date") {
    return mapDateFilterStatusIds(() => "")
  }

  return mapDateFilterStatusIds(
    (statusId) => category.statusLabels?.[statusId] ?? "",
  )
}

const pad = (n: number): string => n.toString().padStart(2, "0")

export const daysFromNow = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
