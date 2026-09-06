import type { AllCardProps } from "~/interfaces"
import type { IsomerSitemap, IsomerSiteProps } from "~/types"
import type { CollectionPagePageProps } from "~/types/page"
import { getParsedDate } from "~/utils/getParsedDate"
import { getSitemapAsArray } from "~/utils/getSitemapAsArray"
import { hasNonEmptyString } from "~/utils/truthiness"

import { getPillAndPlaintextTags } from "./getPillAndPlaintextTags"
import { getTagsFromTagged } from "./getTagsFromTagged"
import { sortCollectionItems } from "./sortCollectionItems"

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
  if (hasNonEmptyString(item.image?.src)) {
    return item.image
  }

  switch (showThumbnail.fallback) {
    case "logo": {
      return {
        alt: `${site.siteName} site logo`,
        isContainNeeded: true,
        src: site.logoUrl,
      }
    }
    case "first-image": {
      if (hasNonEmptyString(item.firstImage?.src)) {
        return item.firstImage
      }

      return {
        alt: `${site.siteName} site logo`,
        isContainNeeded: true,
        src: site.logoUrl,
      }
    }
    default: {
      const _: never = showThumbnail.fallback
      return undefined
    }
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

  for (let i = 2; i <= permalinkParts.length; i += 1) {
    const currPermalink = permalinkParts.slice(0, i).join("/")

    if (!currSitemap.children) {
      return []
    }

    const sitemapChild = currSitemap.children.find(
      (entry) => entry.permalink === currPermalink,
    )

    if (!sitemapChild) {
      return []
    }

    currSitemap = sitemapChild
  }

  if (!currSitemap.children) {
    return []
  }

  const items = []

  for (const child of currSitemap.children) {
    for (const item of getSitemapAsArray(child)) {
      if (
        item.layout === "file" ||
        item.layout === "link" ||
        item.layout === "article"
      ) {
        items.push(item)
      }
    }
  }

  const transformedItems = items.map((item) => {
    const date =
      showDate !== false && item.date !== undefined && item.date !== ""
        ? getParsedDate(item.date)
        : undefined
    const image = getItemImage({ item, showThumbnail, site })
    const { pillTags, plaintextTags } = getPillAndPlaintextTags(
      item.tagged,
      tagCategories,
    )

    const baseItem = {
      date,
      description: item.summary,
      id: item.permalink,
      image,
      isContainNeeded: image?.isContainNeeded === true,
      lastModified: item.lastModified,
      pillTags,
      plaintextTags,
      site,
      tags:
        tagCategories && item.tagged
          ? getTagsFromTagged(item.tagged, tagCategories)
          : undefined,
      title: item.title,
      type: "collectionCard" as const,
    }

    if (item.layout === "file") {
      return {
        ...baseItem,
        fileDetails: item.fileDetails,
        url: item.ref,
        variant: "file",
      }
    } else if (item.layout === "link") {
      return {
        ...baseItem,
        url: item.ref,
        variant: "link",
      }
    }

    return {
      ...baseItem,
      url: item.permalink,
      variant: "article",
    }
  }) satisfies AllCardProps[]

  return sortCollectionItems({
    items: transformedItems,
    sortBy,
    sortDirection,
    sortOrder,
  })
}
