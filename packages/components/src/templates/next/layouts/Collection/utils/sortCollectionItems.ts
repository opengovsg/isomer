import type { AllCardProps } from "~/interfaces"

export type SortableCardProps = AllCardProps & {
  rawDate?: Date
}

export interface SortCollectionItemsProps {
  items: SortableCardProps[]
  sortBy?: "date" | "title"
  sortDirection?: "asc" | "desc"
}

export const sortCollectionItems = ({
  items,
  sortBy = "date",
  sortDirection = "asc",
}: SortCollectionItemsProps): AllCardProps[] => {
  return items.sort((a, b) => {
    // Sort by last updated date, tiebreaker by title
    if (a.rawDate && b.rawDate && a.rawDate.getTime() === b.rawDate.getTime()) {
      // localeCompare better than > operator as
      // it properly handles international and special characters
      return a.title.localeCompare(b.title)
    }

    // If both items have no dates, sort by title
    if (a.rawDate === undefined && b.rawDate === undefined) {
      return a.title.localeCompare(b.title)
    }

    // Rank items with no dates last
    if (a.rawDate === undefined) {
      return 1
    }

    if (b.rawDate === undefined) {
      return -1
    }

    return a.rawDate.getTime() < b.rawDate.getTime() ? 1 : -1
  }) as AllCardProps[]
}
