import type {
  DateFilterCard,
  DateFilterDisplayEntry,
} from "~/interfaces/internal/DateFilter"

import { getDateFilterStatus } from "../../layouts/Collection/utils/getDateFilterStatus"

export const getDateFilterCardsFromEntries = (
  entries: DateFilterDisplayEntry[],
): DateFilterCard[] =>
  entries.map((entry) => {
    const { statusLabels, ...displayFields } = entry
    const status = getDateFilterStatus(entry)
    const statusLabel =
      statusLabels.find(({ id }) => id === status)?.label ?? status

    return { ...displayFields, status, statusLabel }
  })
