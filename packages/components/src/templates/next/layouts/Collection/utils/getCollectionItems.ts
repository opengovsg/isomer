import type { IsomerSiteProps } from "~/engine"
import type { AllCardProps } from "~/interfaces"
import { getParsedDate, getSitemapAsArray } from "~/utils"

const CATEGORY_OTHERS = "Others"

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

export const getCollectionItems = (
  site: IsomerSiteProps,
  permalink: string,
): AllCardProps[] => {
  let currSitemap = site.siteMap
  const permalinkParts = permalink.split("/")

  for (let i = 2; i <= permalinkParts.length; i++) {
    const currPermalink = permalinkParts.slice(0, i).join("/")

    if (!currSitemap.children) {
      return []
    }

    const child = currSitemap.children.find(
      (child) => child.permalink === currPermalink,
    )

    if (!child) {
      return []
    }

    currSitemap = child
  }

  if (!currSitemap.children) {
    return []
  }

  const items = currSitemap.children.flatMap((child) =>
    getSitemapAsArray(child),
  )

  const transformedItems = items
    .filter(
      (item) =>
        item.layout === "file" ||
        item.layout === "link" ||
        item.layout === "article",
    )
    .map((item) => {
      const date =
        item.date !== undefined ? getParsedDate(item.date) : undefined

      const baseItem = {
        type: "collectionCard" as const,
        rawDate: date,
        lastUpdated: date?.toISOString(),
        category: item.category || CATEGORY_OTHERS,
        title: item.title,
        description: item.summary,
        image: item.image,
        site,
        tags: item.tags,
      }

      if (item.layout === "file") {
        return {
          ...baseItem,
          variant: "file",
          url: item.ref,
          fileDetails: item.fileDetails,
        }
      } else if (item.layout === "link") {
        return {
          ...baseItem,
          variant: "link",
          url: item.ref,
        }
      }

      return {
        ...baseItem,
        variant: "article",
        url: item.permalink,
      }
    }) satisfies AllCardProps[]

  return sortCollectionItems({ items: transformedItems })
}
