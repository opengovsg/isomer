import type { GetCollectionItemsProps } from "./getCollectionItems"
import type { AllCardProps } from "~/interfaces"

interface SortCollectionItemsProps
  extends Pick<
    GetCollectionItemsProps,
    "sortOrder" | "sortBy" | "sortDirection"
  > {
  items: AllCardProps[]
}

// Helper types to extract the sortBy and sortDirection from sortOrder
type FirstPart<T extends string> = T extends `${infer F}-${string}` ? F : never
type SecondPart<T extends string> = T extends `${string}-${infer S}` ? S : never
type SortBy =
  | FirstPart<NonNullable<GetCollectionItemsProps["sortOrder"]>>
  | GetCollectionItemsProps["sortBy"]
type SortDirection =
  | SecondPart<NonNullable<GetCollectionItemsProps["sortOrder"]>>
  | GetCollectionItemsProps["sortDirection"]

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
  sortDirection: NonNullable<SortCollectionItemsProps["sortDirection"]>,
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
  sortDirection: NonNullable<SortCollectionItemsProps["sortDirection"]>,
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

const compareCategories = (
  a: AllCardProps,
  b: AllCardProps,
  sortDirection: NonNullable<SortCollectionItemsProps["sortDirection"]>,
): number => {
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
      const _: never = sortDirection
      return 1
  }
}

const compareLastModified = (
  a: AllCardProps,
  b: AllCardProps,
  sortDirection: NonNullable<SortCollectionItemsProps["sortDirection"]>,
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

// Sort by published date, followed by last modified date, tiebreaker by title
// If published date is not available, sort by title first, followed by last
// modified date
const sortCollectionItemsByDate = ({
  items,
  sortDirection = "desc",
}: Omit<SortCollectionItemsProps, "sortBy">) => {
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
}: Omit<SortCollectionItemsProps, "sortBy">) => {
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

// Sort by category, followed by title, followed by published date, tiebreaker
// by last modified date
const sortCollectionItemsByCategory = ({
  items,
  sortDirection = "asc",
}: Omit<SortCollectionItemsProps, "sortBy">) => {
  return items.sort((a, b) => {
    const bothSameCategory = a.category === b.category
    const bothSameTitle = a.title === b.title
    const bothHaveDates = a.date instanceof Date && b.date instanceof Date
    const bothSameDates = a.date?.getTime() === b.date?.getTime()
    const aNoDate = a.date === undefined
    const bNoDate = b.date === undefined

    // Sort by first priority: Category
    if (!bothSameCategory) {
      return compareCategories(a, b, sortDirection)
    }

    // Sort by second priority: Title
    if (!bothSameTitle) {
      return compareTitles(a, b, sortDirection)
    }

    // ===== Scenario 1: Both items have published dates =====
    // Sort by third priority: Published date
    if (bothHaveDates && !bothSameDates) {
      return compareDates(a, b, sortDirection)
    }

    // Sort by fourth priority: Last modified date
    if (bothHaveDates && bothSameDates) {
      return compareLastModified(a, b, sortDirection)
    }

    // ===== Scenario 2: Both items do not have published dates =====
    // Sort by third priority: Last modified date
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

export const sortCollectionItems = ({
  items,
  sortOrder,
  sortBy,
  sortDirection,
}: SortCollectionItemsProps): AllCardProps[] => {
  const derivedSortBy = sortOrder ? (sortOrder.split("-")[0] as SortBy) : sortBy
  const derivedSortDirection = sortOrder
    ? (sortOrder.split("-")[1] as SortDirection)
    : sortDirection

  switch (derivedSortBy) {
    case "date":
    case undefined:
      return sortCollectionItemsByDate({
        items,
        sortDirection: derivedSortDirection,
      })
    case "title":
      return sortCollectionItemsByTitle({
        items,
        sortDirection: derivedSortDirection,
      })
    case "category":
      return sortCollectionItemsByCategory({
        items,
        sortDirection: derivedSortDirection,
      })
    default:
      const _: never = derivedSortBy
      return []
  }
}
