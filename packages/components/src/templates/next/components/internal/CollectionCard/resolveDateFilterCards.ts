import type { DateFilterDisplayEntry } from "~/interfaces/internal/CollectionCard"

import { getDateFilterCardsFromEntries } from "../../../layouts/Collection/utils/dateFilterCards"
import { getTodayInSingapore } from "../../../layouts/Collection/utils/getDateFilterStatus"

export const resolveDateFilterCards = (entries?: DateFilterDisplayEntry[]) => {
  if (!entries || entries.length === 0) {
    return undefined
  }

  return getDateFilterCardsFromEntries(entries, getTodayInSingapore())
}
