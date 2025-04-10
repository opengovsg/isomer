import type { GetCollectionItemsProps } from "./getCollectionItems"
import type { AllCardProps } from "~/interfaces"

export type SortableCardProps = AllCardProps & {
  rawDate?: Date
}

export interface SortCollectionItemsProps
  extends Pick<GetCollectionItemsProps, "sortBy" | "sortDirection"> {
  items: SortableCardProps[]
}

// Sort by last updated date, tiebreaker by title
const sortCollectionItemsByDate = ({
  items,
  sortDirection = "desc",
}: Omit<SortCollectionItemsProps, "sortBy">) => {
  return items.sort((a, b) => {
    const bothHaveDates = a.rawDate instanceof Date && b.rawDate instanceof Date
    const bothSameDatetime = a.rawDate?.getTime() === b.rawDate?.getTime()

    if (bothHaveDates && !bothSameDatetime) {
      // Type assertion because TS control-flow narrowing only works when
      // check is done inline and not when we define the variable
      const aDate = a.rawDate as unknown as Date
      const bDate = b.rawDate as unknown as Date

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

    const bothNoDates = a.rawDate === undefined && b.rawDate === undefined
    if ((bothHaveDates && bothSameDatetime) || bothNoDates) {
      return a.title.localeCompare(b.title, undefined, { numeric: true })
    }

    return a.rawDate instanceof Date ? -1 : 1
  }) as AllCardProps[]
}

// Sort by title, tiebreaker by last updated date
const sortCollectionItemsByTitle = ({
  items,
  sortDirection = "asc",
}: Omit<SortCollectionItemsProps, "sortBy">) => {
  return items.sort((a, b) => {
    const bothHaveDates = a.rawDate instanceof Date && b.rawDate instanceof Date
    const bothNoDates = a.rawDate === undefined && b.rawDate === undefined

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
      const aDate = a.rawDate as unknown as Date
      const bDate = b.rawDate as unknown as Date

      return aDate.getTime() < bDate.getTime() ? 1 : -1
    }

    return a.rawDate instanceof Date ? -1 : 1
  }) as AllCardProps[]
}

// Sort by category, tiebreaker by title
const sortCollectionItemsByCategory = ({
  items,
  sortDirection = "asc",
}: Omit<SortCollectionItemsProps, "sortBy">) => {
  return items.sort((a, b) => {
    const bothHaveDates = a.rawDate instanceof Date && b.rawDate instanceof Date
    const bothNoDates = a.rawDate === undefined && b.rawDate === undefined

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

    return a.rawDate instanceof Date ? -1 : 1
  }) as AllCardProps[]
}

export const sortCollectionItems = ({
  items,
  sortBy = "date",
  sortDirection = "desc",
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
