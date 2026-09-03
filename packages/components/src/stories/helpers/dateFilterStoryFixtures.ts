import type { CollectionPagePageProps } from "~/types"
import { DATE_FILTER_STATUS, type DateFilterStatusId } from "~/types/constants"

export const DATE_FILTER_TAG_CATEGORIES: CollectionPagePageProps["tagCategories"] =
  [
    {
      id: "event-date",
      label: "Event Date",
      type: "date",
      statusLabels: {
        [DATE_FILTER_STATUS.Ended.id]: DATE_FILTER_STATUS.Ended.defaultLabel,
        [DATE_FILTER_STATUS.Ongoing.id]:
          DATE_FILTER_STATUS.Ongoing.defaultLabel,
        [DATE_FILTER_STATUS.Upcoming.id]:
          DATE_FILTER_STATUS.Upcoming.defaultLabel,
      } satisfies Record<DateFilterStatusId, string>,
    },
    {
      id: "registration-deadline",
      label: "Registration Deadline",
      type: "date",
      statusLabels: {
        [DATE_FILTER_STATUS.Ended.id]: "Registration closed",
        [DATE_FILTER_STATUS.Ongoing.id]: "Registration open",
        [DATE_FILTER_STATUS.Upcoming.id]: "Registration upcoming",
      } satisfies Record<DateFilterStatusId, string>,
    },
  ]

export const statusLabelsFor = (
  categoryId: string,
): Record<DateFilterStatusId, string> => {
  const category = DATE_FILTER_TAG_CATEGORIES.find(
    (entry) => entry.id === categoryId,
  )

  if (!category || category.type !== "date") {
    return {
      [DATE_FILTER_STATUS.Ended.id]: "",
      [DATE_FILTER_STATUS.Ongoing.id]: "",
      [DATE_FILTER_STATUS.Upcoming.id]: "",
    }
  }

  return {
    [DATE_FILTER_STATUS.Ended.id]: category.statusLabels?.ENDED ?? "",
    [DATE_FILTER_STATUS.Ongoing.id]: category.statusLabels?.ONGOING ?? "",
    [DATE_FILTER_STATUS.Upcoming.id]: category.statusLabels?.UPCOMING ?? "",
  }
}

const pad = (n: number): string => n.toString().padStart(2, "0")

export const daysFromNow = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
