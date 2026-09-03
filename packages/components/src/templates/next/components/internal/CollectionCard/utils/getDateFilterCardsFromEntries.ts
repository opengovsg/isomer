import type {
  DateFilterCard,
  DateFilterDisplayEntry,
} from "~/interfaces/internal/CollectionCard"

import { getDateFilterStatus } from "./getDateFilterStatus"

export const getDateFilterCardsFromEntries = (
  entries: DateFilterDisplayEntry[],
): DateFilterCard[] =>
  entries.map((entry) => {
    const { statusLabels, ...displayFields } = entry
    const status = getDateFilterStatus({
      date: entry.date,
      endDate: entry.endDate,
    })
    const statusLabel = statusLabels[status]

    return { ...displayFields, status, statusLabel }
  })
