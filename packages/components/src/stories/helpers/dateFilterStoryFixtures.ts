import type { DateFilterDisplayEntry } from "~/interfaces/internal/CollectionCard"
import type { CollectionPagePageProps } from "~/types"
import { addDays, format } from "date-fns"
import { DATE_FILTER_STATUS, type DateFilterStatusId } from "~/types/constants"

// Matches `.storybook/preview.tsx` MockDateDecorator — story dates are anchored here
// rather than `new Date()` at module load, which runs before mockdate is applied.
export const STORYBOOK_MOCKED_DATE = "2025-08-09T12:00:00.000Z"

export const offsetDateFromStorybookToday = (days: number): string =>
  format(addDays(new Date(STORYBOOK_MOCKED_DATE), days), "yyyy-MM-dd")

export const daysFromNow = offsetDateFromStorybookToday

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

export const upcomingDateFilterEntry: DateFilterDisplayEntry = {
  id: "event-date",
  label: "Event Date",
  dateText: "8 Sep - 18 Sep 2025",
  date: offsetDateFromStorybookToday(30),
  endDate: offsetDateFromStorybookToday(40),
  statusLabels: statusLabelsFor("event-date"),
}

export const ongoingDateFilterEntry: DateFilterDisplayEntry = {
  id: "registration-deadline",
  label: "Registration Deadline",
  dateText: "4 Aug - 14 Aug 2025",
  date: offsetDateFromStorybookToday(-5),
  endDate: offsetDateFromStorybookToday(5),
  statusLabels: statusLabelsFor("registration-deadline"),
}

export const upcomingAndOngoingDateFilterEntries: DateFilterDisplayEntry[] = [
  upcomingDateFilterEntry,
  ongoingDateFilterEntry,
]
