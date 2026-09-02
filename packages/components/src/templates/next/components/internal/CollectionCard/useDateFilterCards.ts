import type { DateFilterDisplayEntry } from "~/interfaces/internal/CollectionCard"
import { useMemo } from "react"

import { getDateFilterCardsFromEntries } from "../../../layouts/Collection/utils/dateFilterCards"
import { getTodayInSingapore } from "../../../layouts/Collection/utils/getDateFilterStatus"

export const useDateFilterCards = (entries?: DateFilterDisplayEntry[]) =>
  useMemo(() => {
    if (!entries || entries.length === 0) {
      return undefined
    }

    return getDateFilterCardsFromEntries(entries, getTodayInSingapore())
  }, [entries])
