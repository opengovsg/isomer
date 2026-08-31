import type { AllCardProps } from "~/interfaces"
import { parseISO } from "date-fns"
import { parseCollectionSortOrder } from "~/utils/collectionSortOrder"

import type { GetCollectionItemsProps } from "./getCollectionItems"

interface SortCollectionItemsProps extends Pick<
  GetCollectionItemsProps,
  "sortOrder" | "sortBy" | "sortDirection"
> {
  items: AllCardProps[]
}

type SortDirection = NonNullable<SortCollectionItemsProps["sortDirection"]>

const getLastModifiedDate = (item: AllCardProps): Date | undefined => {
  if (!item.lastModified) {
    return undefined
  }

  try {
    // NOTE: The lastModified field is guaranteed to be in ISO 8601 format, as it
    // is generated from the updatedAt field in the database
    return new Date(item.lastModified)
  } catch {
    return undefined
  }
}

const compareDates = (
  a: AllCardProps,
  b: AllCardProps,
  sortDirection: SortDirection,
): number => {
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
      const _: never = sortDirection
      return 1
  }
}

const compareTitles = (
  a: AllCardProps,
  b: AllCardProps,
  sortDirection: SortDirection,
): number => {
  switch (sortDirection) {
    case "asc":
      return a.title.localeCompare(b.title, undefined, { numeric: true })
    case "desc":
      return b.title.localeCompare(a.title, undefined, { numeric: true })
    default:
      const _: never = sortDirection
      return 1
  }
}

const compareLastModified = (
  a: AllCardProps,
  b: AllCardProps,
  sortDirection: SortDirection,
): number => {
  const aLastModified = getLastModifiedDate(a)
  const bLastModified = getLastModifiedDate(b)

  if (aLastModified && bLastModified) {
    const aDate = aLastModified.getTime()
    const bDate = bLastModified.getTime()

    switch (sortDirection) {
      case "asc":
        return aDate >= bDate ? 1 : -1
      case "desc":
        return aDate <= bDate ? 1 : -1
      default:
        const _: never = sortDirection
        return 1
    }
  }

  return 0
}

const getDateFilterStartTime = (
  item: AllCardProps,
  filterId: string,
): number | undefined => {
  const dateValue = item.dateTagged?.find(({ id }) => id === filterId)?.date

  if (!dateValue) {
    return undefined
  }

  return parseISO(dateValue).getTime()
}

const compareDateFilterStartDates = (
  a: AllCardProps,
  b: AllCardProps,
  filterId: string,
  sortDirection: SortDirection,
): number => {
  const aDate = getDateFilterStartTime(a, filterId)
  const bDate = getDateFilterStartTime(b, filterId)
  const aNoDate = aDate === undefined
  const bNoDate = bDate === undefined

  if (aNoDate && bNoDate) {
    return compareTitles(a, b, "asc")
  }

  if (aNoDate) {
    return 1
  }

  if (bNoDate) {
    return -1
  }

  if (aDate !== bDate) {
    switch (sortDirection) {
      case "asc":
        return aDate >= bDate ? 1 : -1
      case "desc":
        return aDate <= bDate ? 1 : -1
      default:
        const _: never = sortDirection
        return 1
    }
  }

  return compareTitles(a, b, "asc")
}

// Sort by published date, followed by last modified date, tiebreaker by title
// If published date is not available, sort by title first, followed by last
// modified date
const sortCollectionItemsByDate = ({
  items,
  sortDirection = "desc",
}: Omit<SortCollectionItemsProps, "sortBy" | "sortOrder"> & {
  sortDirection?: SortDirection
}) => {
  return items.sort((a, b) => {
    const bothHaveDates = a.date instanceof Date && b.date instanceof Date
    const bothSameDate = a.date?.getTime() === b.date?.getTime()
    const bothSameLastModified =
      getLastModifiedDate(a)?.getTime() === getLastModifiedDate(b)?.getTime()
    const bothSameTitle = a.title === b.title
    const aNoDate = a.date === undefined
    const bNoDate = b.date === undefined

    // ===== Scenario 1: Both items have published dates =====
    // Sort by first priority: Published date
    if (bothHaveDates && !bothSameDate) {
      return compareDates(a, b, sortDirection)
    }

    // Sort by second priority: Last modified date
    if (bothHaveDates && bothSameDate && !bothSameLastModified) {
      return compareLastModified(a, b, sortDirection)
    }

    // Sort by third priority: Title
    if (bothHaveDates && bothSameDate && bothSameLastModified) {
      return compareTitles(a, b, "asc") // Always sort titles in ascending order
    }

    // ===== Scenario 2: Both items do not have published dates =====
    // Sort by first priority: Title
    if (aNoDate && bNoDate && !bothSameTitle) {
      return compareTitles(a, b, "asc") // Always sort titles in ascending order
    }

    // Sort by second priority: Last modified date
    if (aNoDate && bNoDate && bothSameTitle) {
      return compareLastModified(a, b, sortDirection)
    }

    // ===== Scenario 3: One item has a published date, the other does not =====
    // If one has a date and the other does not, place the one with a date first
    if (aNoDate) {
      return 1 // Place items without dates at the end
    } else if (bNoDate) {
      return -1 // Place items without dates at the end
    }

    // This should never be reached
    return a.date instanceof Date ? -1 : 1
  })
}

// Sort by title, followed by published date, tiebreaker by last modified date
const sortCollectionItemsByTitle = ({
  items,
  sortDirection = "asc",
}: Omit<SortCollectionItemsProps, "sortBy" | "sortOrder"> & {
  sortDirection?: SortDirection
}) => {
  return items.sort((a, b) => {
    const bothSameTitle = a.title === b.title
    const bothHaveDates = a.date instanceof Date && b.date instanceof Date
    const bothSameDate = a.date?.getTime() === b.date?.getTime()
    const aNoDate = a.date === undefined
    const bNoDate = b.date === undefined

    // Sort by first priority: Title
    if (!bothSameTitle) {
      return compareTitles(a, b, sortDirection)
    }

    // ===== Scenario 1: Both items have published dates =====
    // Sort by second priority: Published date
    if (bothHaveDates && !bothSameDate) {
      return compareDates(a, b, sortDirection)
    }

    // Sort by third priority: Last modified date
    if (bothHaveDates && bothSameDate) {
      return compareLastModified(a, b, sortDirection)
    }

    // ===== Scenario 2: Both items do not have published dates =====
    // Sort by second priority: Last modified date
    if (aNoDate && bNoDate) {
      return compareLastModified(a, b, sortDirection)
    }

    // ===== Scenario 3: One item has a published date, the other does not =====
    // If one has a date and the other does not, place the one with a date first
    if (aNoDate && !bNoDate) {
      return 1 // Place items without dates at the end
    } else if (!aNoDate && bNoDate) {
      return -1 // Place items without dates at the end
    }

    // This should never be reached
    return a.date instanceof Date ? -1 : 1
  })
}

const sortCollectionItemsByDateFilter = ({
  items,
  filterId,
  sortDirection = "desc",
}: {
  items: AllCardProps[]
  filterId: string
  sortDirection?: SortDirection
}) => {
  return items.sort((a, b) =>
    compareDateFilterStartDates(a, b, filterId, sortDirection),
  )
}

export const sortCollectionItems = ({
  items,
  sortOrder,
  sortBy,
  sortDirection,
}: SortCollectionItemsProps): AllCardProps[] => {
  const parsedSortOrder = parseCollectionSortOrder(sortOrder)

  if (!sortOrder) {
    switch (sortBy) {
      case "title":
        return sortCollectionItemsByTitle({ items, sortDirection })
      case "date":
      case undefined:
      default:
        return sortCollectionItemsByDate({ items, sortDirection })
    }
  }

  switch (parsedSortOrder.kind) {
    case "date":
      return sortCollectionItemsByDate({
        items,
        sortDirection: parsedSortOrder.direction,
      })
    case "title":
      return sortCollectionItemsByTitle({
        items,
        sortDirection: parsedSortOrder.direction,
      })
    case "date-filter":
      return sortCollectionItemsByDateFilter({
        items,
        filterId: parsedSortOrder.filterId,
        sortDirection: parsedSortOrder.direction,
      })
    default:
      const _: never = parsedSortOrder
      return []
  }
}
