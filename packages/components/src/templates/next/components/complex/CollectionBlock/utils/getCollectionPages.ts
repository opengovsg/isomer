import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { IsomerSiteProps } from "~/types"
import type { IsomerCollectionPageSitemap } from "~/types/sitemap"

import {
  getCollectionItems,
  processCollectionItems,
} from "../../../../layouts/Collection/utils"

interface GetCollectionPagesProps {
  site: IsomerSiteProps
  collectionParent: IsomerCollectionPageSitemap
}

export const NUMBER_OF_PAGES_TO_DISPLAY = 3

export const getCollectionPages = ({
  site,
  collectionParent,
}: GetCollectionPagesProps): ProcessedCollectionCardProps[] => {
  const items = getCollectionItems({
    site,
    permalink: collectionParent.permalink,
    sortOrder: collectionParent.collectionPagePageProps?.sortOrder,
    sortBy: collectionParent.collectionPagePageProps?.defaultSortBy,
    sortDirection:
      collectionParent.collectionPagePageProps?.defaultSortDirection,
    showThumbnail: { fallback: "first-image" },
  })

  const itemsWithCollectionBlockFallback = items.map((item) =>
    item.isContainNeeded && item.image?.src === site.logoUrl
      ? { ...item, image: undefined, isContainNeeded: false }
      : item,
  )

  return processCollectionItems(itemsWithCollectionBlockFallback).slice(
    0,
    NUMBER_OF_PAGES_TO_DISPLAY,
  )
}
