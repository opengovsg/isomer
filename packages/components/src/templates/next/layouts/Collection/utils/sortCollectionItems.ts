import type { GetCollectionItemsProps } from "./getCollectionItems"
import type { AllCardProps } from "~/interfaces"

export type SortableCardProps = AllCardProps & {
  rawDate?: Date
}

export interface SortCollectionItemsProps {
  items: SortableCardProps[]
  sortBy?: GetCollectionItemsProps["sortBy"]
  sortDirection?: GetCollectionItemsProps["sortDirection"]
}

// Sort by last updated date, tiebreaker by title
const sortCollectionItemsByDate = ({
  items,
  sortDirection = "desc",
}: Omit<SortCollectionItemsProps, "sortBy">) => {
  return items.sort((a, b) => {
    // If both items have no dates, sort by title ascending as a tiebreaker
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

    // If both items have same date, sort by title ascending as a tiebreaker
    if (a.rawDate.getTime() === b.rawDate.getTime()) {
      return a.title.localeCompare(b.title)
    }

    switch (sortDirection) {
      case "asc":
        return a.rawDate.getTime() < b.rawDate.getTime() ? 1 : -1
      case "desc":
        return a.rawDate.getTime() > b.rawDate.getTime() ? 1 : -1
      default:
        const exhaustiveCheck: never = sortDirection
        return exhaustiveCheck
    }
  }) as AllCardProps[]
}

// Sort by title, tiebreaker by last updated date
const sortCollectionItemsByTitle = ({
  items,
  sortDirection = "asc",
}: Omit<SortCollectionItemsProps, "sortBy">) => {
  return items.sort((a, b) => {
    // Rank items with no dates last
    if (a.rawDate === undefined) {
      return 1
    }

    if (b.rawDate === undefined) {
      return -1
    }

    // If titles are the same, sort by last updated date descending as a tiebreaker
    if (a.title === b.title) {
      return a.rawDate.getTime() < b.rawDate.getTime() ? 1 : -1
    }

    switch (sortDirection) {
      case "asc":
        return a.title.localeCompare(b.title)
      case "desc":
        return b.title.localeCompare(a.title)
      default:
        const exhaustiveCheck: never = sortDirection
        return exhaustiveCheck
    }
  }) as AllCardProps[]
}

export const sortCollectionItems = ({
  items,
  sortBy = "date",
  sortDirection = "asc",
}: SortCollectionItemsProps): AllCardProps[] => {
  switch (sortBy) {
    case "date":
      return sortCollectionItemsByDate({ items, sortDirection })
    case "title":
      return sortCollectionItemsByTitle({ items, sortDirection })
    default:
      const exhaustiveCheck: never = sortBy
      return exhaustiveCheck
  }
}
