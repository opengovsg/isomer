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
    sortBy: collectionParent.collectionPagePageProps?.defaultSortBy,
    sortDirection:
      collectionParent.collectionPagePageProps?.defaultSortDirection,
  })

  if (items.length === 0) {
    throw new Error(
      `CollectionBlock: No collection items found for reference link ${collectionParent.permalink}`,
    )
  }

  return processCollectionItems(items).slice(0, NUMBER_OF_PAGES_TO_DISPLAY)
}
