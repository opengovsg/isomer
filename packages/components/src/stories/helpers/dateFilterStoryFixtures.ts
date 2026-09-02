import type { CollectionPagePageProps } from "~/types"
import type { DateFilterStatusId } from "~/types/constants"

export const DATE_FILTER_TAG_CATEGORIES: CollectionPagePageProps["tagCategories"] =
  [
    {
      id: "event-date",
      label: "Event Date",
      type: "date",
      statusLabels: {
        ENDED: "Event ended",
        ONGOING: "Ongoing",
        UPCOMING: "Upcoming",
      },
    },
    {
      id: "registration-deadline",
      label: "Registration Deadline",
      type: "date",
      statusLabels: {
        ENDED: "Registration closed",
        ONGOING: "Registration open",
        UPCOMING: "Registration upcoming",
      },
    },
  ]

export const statusLabelsFor = (
  categoryId: string,
): Record<DateFilterStatusId, string> => {
  const category = DATE_FILTER_TAG_CATEGORIES?.find(
    (entry) => entry.id === categoryId,
  )

  if (!category || category.type !== "date") {
    return { ENDED: "", ONGOING: "", UPCOMING: "" }
  }

  return {
    ENDED: category.statusLabels?.ENDED ?? "",
    ONGOING: category.statusLabels?.ONGOING ?? "",
    UPCOMING: category.statusLabels?.UPCOMING ?? "",
  }
}

const pad = (n: number): string => n.toString().padStart(2, "0")

export const daysFromNow = (days: number) => {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}
