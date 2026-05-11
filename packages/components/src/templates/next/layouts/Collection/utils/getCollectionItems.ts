import type { AllCardProps } from "~/interfaces"
import type { IsomerSitemap, IsomerSiteProps } from "~/types"
import type { CollectionPagePageProps } from "~/types/page"
import { getParsedDate } from "~/utils/getParsedDate"
import { getSitemapAsArray } from "~/utils/getSitemapAsArray"

import { getTagsFromTagged } from "./getTagsFromTagged"
import { sortCollectionItems } from "./sortCollectionItems"

const CATEGORY_OTHERS = "Others"

interface GetItemImageProps {
  showThumbnail: CollectionPagePageProps["showThumbnail"]
  item: IsomerSitemap
  site: IsomerSiteProps
}

type GetItemImageResult =
  | {
      src: string
      alt: string
      isContainNeeded?: boolean
    }
  | undefined

const getItemImage = ({
  showThumbnail,
  item,
  site,
}: GetItemImageProps): GetItemImageResult => {
  // If showThumbnail is undefined, we will hide all the thumbnails of the
  // collection, regardless of whether the individual items have images or not
  if (!showThumbnail) {
    return undefined
  }

  // If the item has an image, we will show the item's image
  if (item.image?.src) {
    return item.image
  }

  switch (showThumbnail.fallback) {
    case "logo":
      return {
        src: site.logoUrl,
        alt: `${site.siteName} site logo`,
        isContainNeeded: true,
      }
    case "first-image":
      if (item.firstImage?.src) {
        return item.firstImage
      }

      return {
        src: site.logoUrl,
        alt: `${site.siteName} site logo`,
        isContainNeeded: true,
      }
    default:
      const _: never = showThumbnail.fallback
      return undefined
  }
}

export type GetCollectionItemsProps = Pick<
  CollectionPagePageProps,
  "sortOrder" | "showDate" | "showThumbnail" | "tagCategories"
> & {
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
  sortOrder,
  showDate,
  showThumbnail,
  tagCategories,
}: GetCollectionItemsProps): AllCardProps[] => {
  let currSitemap: IsomerSitemap = site.siteMap
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

  const items = currSitemap.children
    .flatMap((child) => getSitemapAsArray(child))
    .filter(
      (item) =>
        item.layout === "file" ||
        item.layout === "link" ||
        item.layout === "article",
    )

  const transformedItems = items.map((item) => {
    const date =
      showDate !== false && item.date !== undefined && item.date !== ""
        ? getParsedDate(item.date)
        : undefined
    const image = getItemImage({ showThumbnail, item, site })

    const baseItem = {
      type: "collectionCard" as const,
      id: item.permalink,
      date,
      lastModified: item.lastModified,
      category: item.category || CATEGORY_OTHERS,
      title: item.title,
      description: item.summary,
      image,
      isContainNeeded: image?.isContainNeeded || false,
      site,
      tags:
        tagCategories && item.tagged
          ? getTagsFromTagged(item.tagged, tagCategories)
          : item.tags,
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
    sortOrder,
    sortBy,
    sortDirection,
  })
}
