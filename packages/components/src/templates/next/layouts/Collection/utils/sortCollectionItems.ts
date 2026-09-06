/* oxlint-disable eslint/complexity -- date/title/last-modified sort tie-break rules are intentionally colocated */
import type { AllCardProps } from "~/interfaces"

import type { GetCollectionItemsProps } from "./getCollectionItems"

interface SortCollectionItemsProps extends Pick<
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
  aDate: Date,
  bDate: Date,
  sortDirection: NonNullable<SortCollectionItemsProps["sortDirection"]>,
): number => {
  switch (sortDirection) {
    case "asc": {
      return aDate.getTime() >= bDate.getTime() ? 1 : -1
    }
    case "desc": {
      return aDate.getTime() <= bDate.getTime() ? 1 : -1
    }
    default: {
      const _: never = sortDirection
      return 1
    }
  }
}

const compareTitles = (
  a: AllCardProps,
  b: AllCardProps,
  sortDirection: NonNullable<SortCollectionItemsProps["sortDirection"]>,
): number => {
  switch (sortDirection) {
    case "asc": {
      return a.title.localeCompare(b.title, undefined, { numeric: true })
    }
    case "desc": {
      return b.title.localeCompare(a.title, undefined, { numeric: true })
    }
    default: {
      const _: never = sortDirection
      return 1
    }
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
      case "asc": {
        return aDate >= bDate ? 1 : -1
      }
      case "desc": {
        return aDate <= bDate ? 1 : -1
      }
      default: {
        const _: never = sortDirection
        return 1
      }
    }
  }

  return 0
}

const compareBothWithDates = (
  a: AllCardProps,
  b: AllCardProps,
  sortDirection: NonNullable<SortCollectionItemsProps["sortDirection"]>,
): number => {
  if (!(a.date instanceof Date) || !(b.date instanceof Date)) {
    return 0
  }

  const bothSameDate = a.date.getTime() === b.date.getTime()
  const bothSameLastModified =
    getLastModifiedDate(a)?.getTime() === getLastModifiedDate(b)?.getTime()

  if (!bothSameDate) {
    return compareDates(a.date, b.date, sortDirection)
  }

  if (!bothSameLastModified) {
    return compareLastModified(a, b, sortDirection)
  }

  return compareTitles(a, b, "asc")
}

const compareBothWithoutDates = (
  a: AllCardProps,
  b: AllCardProps,
  sortDirection: NonNullable<SortCollectionItemsProps["sortDirection"]>,
): number => {
  if (a.title !== b.title) {
    return compareTitles(a, b, "asc")
  }

  return compareLastModified(a, b, sortDirection)
}

const compareCollectionItemsByDate = (
  a: AllCardProps,
  b: AllCardProps,
  sortDirection: NonNullable<SortCollectionItemsProps["sortDirection"]>,
): number => {
  const bothHaveDates = a.date instanceof Date && b.date instanceof Date
  const aNoDate = a.date === undefined
  const bNoDate = b.date === undefined

  if (bothHaveDates) {
    return compareBothWithDates(a, b, sortDirection)
  }

  if (aNoDate && bNoDate) {
    return compareBothWithoutDates(a, b, sortDirection)
  }

  if (aNoDate) {
    return 1
  }
  if (bNoDate) {
    return -1
  }

  return a.date instanceof Date ? -1 : 1
}

// Sort by published date, followed by last modified date, tiebreaker by title
// If published date is not available, sort by title first, followed by last
// modified date
const sortCollectionItemsByDate = ({
  items,
  sortDirection = "desc",
}: Omit<SortCollectionItemsProps, "sortBy">) =>
  items.toSorted((a, b) => compareCollectionItemsByDate(a, b, sortDirection))

const compareCollectionItemsByTitle = (
  a: AllCardProps,
  b: AllCardProps,
  sortDirection: NonNullable<SortCollectionItemsProps["sortDirection"]>,
): number => {
  const bothSameTitle = a.title === b.title
  const bothHaveDates = a.date instanceof Date && b.date instanceof Date
  const bothSameDate = a.date?.getTime() === b.date?.getTime()
  const aNoDate = a.date === undefined
  const bNoDate = b.date === undefined

  if (!bothSameTitle) {
    return compareTitles(a, b, sortDirection)
  }

  if (
    bothHaveDates &&
    !bothSameDate &&
    a.date instanceof Date &&
    b.date instanceof Date
  ) {
    return compareDates(a.date, b.date, sortDirection)
  }

  if (bothHaveDates && bothSameDate) {
    return compareLastModified(a, b, sortDirection)
  }

  if (aNoDate && bNoDate) {
    return compareLastModified(a, b, sortDirection)
  }

  if (aNoDate && !bNoDate) {
    return 1
  }
  if (!aNoDate && bNoDate) {
    return -1
  }

  return a.date instanceof Date ? -1 : 1
}

const sortCollectionItemsByTitle = ({
  items,
  sortDirection = "asc",
}: Omit<SortCollectionItemsProps, "sortBy">) =>
  items.toSorted((a, b) => compareCollectionItemsByTitle(a, b, sortDirection))

interface ParsedSortOrder {
  sortBy: SortBy
  sortDirection: SortDirection
}

const parseSortOrder = (
  sortOrder: NonNullable<GetCollectionItemsProps["sortOrder"]>,
): ParsedSortOrder => {
  switch (sortOrder) {
    case "date-asc": {
      return { sortBy: "date", sortDirection: "asc" }
    }
    case "date-desc": {
      return { sortBy: "date", sortDirection: "desc" }
    }
    case "title-asc": {
      return { sortBy: "title", sortDirection: "asc" }
    }
    case "title-desc": {
      return { sortBy: "title", sortDirection: "desc" }
    }
    default: {
      const _: never = sortOrder
      return { sortBy: "date", sortDirection: "desc" }
    }
  }
}

export const sortCollectionItems = ({
  items,
  sortOrder,
  sortBy,
  sortDirection,
}: SortCollectionItemsProps): AllCardProps[] => {
  const derivedSortBy = sortOrder ? parseSortOrder(sortOrder).sortBy : sortBy
  const derivedSortDirection = sortOrder
    ? parseSortOrder(sortOrder).sortDirection
    : sortDirection

  switch (derivedSortBy) {
    case "date":
    case undefined: {
      return sortCollectionItemsByDate({
        items,
        sortDirection: derivedSortDirection,
      })
    }
    case "title": {
      return sortCollectionItemsByTitle({
        items,
        sortDirection: derivedSortDirection,
      })
    }
    default: {
      const _: never = derivedSortBy
      return []
    }
  }
}
