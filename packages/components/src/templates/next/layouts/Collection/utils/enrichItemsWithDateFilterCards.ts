import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { CollectionPagePageProps } from "~/types"

import { getTodayInSingapore } from "./getDateFilterStatus"
import { getDateFilterValues } from "./getDateFilterValues"

// Attaches live `dateFilterCards` (status pill + date text) to each item on
// the client — status is always computed against today's Singapore date.
export const enrichItemsWithDateFilterCards = (
  items: ProcessedCollectionCardProps[],
  tagCategories: CollectionPagePageProps["tagCategories"] | undefined,
  today: string = getTodayInSingapore(),
): ProcessedCollectionCardProps[] => {
  return items.map((item) => {
    const { dateFilterCards } = getDateFilterValues(
      item.dateTagged,
      tagCategories,
      today,
    )

    return {
      ...item,
      dateFilterCards,
    } as ProcessedCollectionCardProps
  })
}
