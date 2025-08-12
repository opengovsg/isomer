import type { GetCollectionItemsProps } from "./getCollectionItems"
import type { AllCardProps } from "~/interfaces"
import {
  COLLECTION_PAGE_DEFAULT_SORT_BY,
  COLLECTION_PAGE_DEFAULT_SORT_DIRECTION,
} from "~/types"

export interface SortCollectionItemsProps
  extends Pick<GetCollectionItemsProps, "sortBy" | "sortDirection"> {
  items: AllCardProps[]
}

const getLastUpdatedDate = (item: AllCardProps): Date | undefined => {
  if (!item.lastUpdated) {
    return undefined
  }

  try {
    return new Date(item.lastUpdated)
  } catch {
    return undefined
  }
}

// Sort by last updated date, tiebreaker by title
const sortCollectionItemsByDate = ({
  items,
  sortDirection = "desc",
}: Omit<SortCollectionItemsProps, "sortBy">) => {
  return items.sort((a, b) => {
    const bothHaveDates = a.date instanceof Date && b.date instanceof Date
    const bothSameDatetime = a.date?.getTime() === b.date?.getTime()

    if (bothHaveDates && !bothSameDatetime) {
      // Type assertion because TS control-flow narrowing only works when
      // check is done inline and not when we define the variable
      const aDate = a.date as unknown as Date
      const bDate = b.date as unknown as Date

      switch (sortDirection) {
        case "asc":
          return aDate.getTime() >= bDate.getTime() ? 1 : -1
        case "desc":
          return aDate.getTime() <= bDate.getTime() ? 1 : -1
        default:
          const exhaustiveCheck: never = sortDirection
          return exhaustiveCheck
      }
    }

    const aNoDate = a.date === undefined
    const bNoDate = b.date === undefined
    const aLastUpdated = getLastUpdatedDate(a)
    const bLastUpdated = getLastUpdatedDate(b)

    if (
      (aNoDate && bNoDate) ||
      (bothHaveDates && aLastUpdated?.getTime() === bLastUpdated?.getTime())
    ) {
      return a.title.localeCompare(b.title, undefined, { numeric: true })
    }

    // If one has a date and the other does not, place the one with a date first
    if (aNoDate) {
      return 1 // Place items without dates at the end
    } else if (bNoDate) {
      return -1 // Place items without dates at the end
    }

    // Sort by last updated date if both have dates and the dates are the same

    if (aLastUpdated && bLastUpdated) {
      const aDate = aLastUpdated.getTime()
      const bDate = bLastUpdated.getTime()

      switch (sortDirection) {
        case "asc":
          return aDate >= bDate ? 1 : -1
        case "desc":
          return aDate <= bDate ? 1 : -1
        default:
          const exhaustiveCheck: never = sortDirection
          return exhaustiveCheck
      }
    }

    return a.date instanceof Date ? -1 : 1
  })
}

// Sort by title, tiebreaker by last updated date
const sortCollectionItemsByTitle = ({
  items,
  sortDirection = "asc",
}: Omit<SortCollectionItemsProps, "sortBy">) => {
  return items.sort((a, b) => {
    const bothHaveDates = a.date instanceof Date && b.date instanceof Date
    const aNoDate = a.date === undefined
    const bNoDate = b.date === undefined
    const bothNoDates = aNoDate && bNoDate

    if ((bothHaveDates && a.title !== b.title) || bothNoDates) {
      switch (sortDirection) {
        case "asc":
          return a.title.localeCompare(b.title, undefined, { numeric: true })
        case "desc":
          return b.title.localeCompare(a.title, undefined, { numeric: true })
        default:
          const exhaustiveCheck: never = sortDirection
          return exhaustiveCheck
      }
    }

    if (bothHaveDates && a.title === b.title) {
      // Type assertion because TS control-flow narrowing only works when
      // check is done inline and not when we define the variable
      const aDate = a.date as unknown as Date
      const bDate = b.date as unknown as Date

      if (aDate.getTime() === bDate.getTime()) {
        return 0
      }

      return aDate.getTime() < bDate.getTime() ? 1 : -1
    }

    // If one has a date and the other does not, place the one with a date first
    if (aNoDate && !bNoDate) {
      return 1
    } else if (!aNoDate && bNoDate) {
      return -1
    }

    const aLastUpdated = getLastUpdatedDate(a)
    const bLastUpdated = getLastUpdatedDate(b)

    if (aLastUpdated && bLastUpdated) {
      const aDate = aLastUpdated.getTime()
      const bDate = bLastUpdated.getTime()

      return aDate < bDate ? 1 : -1
    }

    return a.date instanceof Date ? -1 : 1
  })
}

// Sort by category, tiebreaker by title
const sortCollectionItemsByCategory = ({
  items,
  sortDirection = "asc",
}: Omit<SortCollectionItemsProps, "sortBy">) => {
  return items.sort((a, b) => {
    const bothHaveDates = a.date instanceof Date && b.date instanceof Date
    const aNoDate = a.date === undefined
    const bNoDate = b.date === undefined
    const bothNoDates = aNoDate && bNoDate

    if ((bothHaveDates && a.category !== b.category) || bothNoDates) {
      switch (sortDirection) {
        case "asc":
          return a.category.localeCompare(b.category, undefined, {
            numeric: true,
          })
        case "desc":
          return b.category.localeCompare(a.category, undefined, {
            numeric: true,
          })
        default:
          const exhaustiveCheck: never = sortDirection
          return exhaustiveCheck
      }
    }

    if (bothHaveDates && a.category === b.category) {
      return a.title.localeCompare(b.title, undefined, { numeric: true })
    }

    // If one has a date and the other does not, place the one with a date first
    if (aNoDate && !bNoDate) {
      return 1
    } else if (!aNoDate && bNoDate) {
      return -1
    }

    const aLastUpdated = getLastUpdatedDate(a)
    const bLastUpdated = getLastUpdatedDate(b)

    if (aLastUpdated && bLastUpdated) {
      const aDate = aLastUpdated.getTime()
      const bDate = bLastUpdated.getTime()

      return aDate < bDate ? 1 : -1
    }

    return a.date instanceof Date ? -1 : 1
  })
}

export const sortCollectionItems = ({
  items,
  sortBy = COLLECTION_PAGE_DEFAULT_SORT_BY,
  sortDirection = COLLECTION_PAGE_DEFAULT_SORT_DIRECTION,
}: SortCollectionItemsProps): AllCardProps[] => {
  switch (sortBy) {
    case "date":
      return sortCollectionItemsByDate({ items, sortDirection })
    case "title":
      return sortCollectionItemsByTitle({ items, sortDirection })
    case "category":
      return sortCollectionItemsByCategory({ items, sortDirection })
    default:
      const exhaustiveCheck: never = sortBy
      return exhaustiveCheck
  }
}
