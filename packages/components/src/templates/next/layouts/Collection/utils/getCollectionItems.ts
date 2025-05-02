import type { IsomerSiteProps } from "~/engine"
import type { AllCardProps } from "~/interfaces"
import type { CollectionPagePageProps } from "~/types/page"
import { getParsedDate, getSitemapAsArray } from "~/utils"
import { sortCollectionItems } from "./sortCollectionItems"

const CATEGORY_OTHERS = "Others"

export interface GetCollectionItemsProps {
  site: IsomerSiteProps
  permalink: string
  sortBy?: CollectionPagePageProps["defaultSortBy"]
  sortDirection?: CollectionPagePageProps["defaultSortDirection"]
}

export const getCollectionItems = ({
  site,
  permalink,
  sortBy,
  sortDirection,
}: GetCollectionItemsProps): AllCardProps[] => {
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
        item.date !== undefined && item.date !== ""
          ? getParsedDate(item.date)
          : undefined

      const baseItem = {
        type: "collectionCard" as const,
        id: item.permalink,
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

  return sortCollectionItems({
    items: transformedItems,
    sortBy,
    sortDirection,
  })
}
