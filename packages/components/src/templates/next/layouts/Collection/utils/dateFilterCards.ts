import type {
  DateFilterCard,
  DateFilterDisplayEntry,
} from "~/interfaces/internal/CollectionCard"
import { resolveDateFilterStatusLabels } from "~/types/constants"

import { getDateFilterStatus, getTodayInSingapore } from "./getDateFilterStatus"

export const getDateFilterCardsFromEntries = (
  entries: DateFilterDisplayEntry[],
  today: string = getTodayInSingapore(),
): DateFilterCard[] =>
  entries.map((entry) => {
    const { statusLabels, ...displayFields } = entry
    const status = getDateFilterStatus(entry, today)
    const resolvedStatusLabels = resolveDateFilterStatusLabels(statusLabels)
    const statusLabel = resolvedStatusLabels[status]

    return { ...displayFields, status, statusLabel }
  })
