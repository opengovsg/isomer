import type { GetCollectionItemsProps } from "../../../../layouts/Collection/utils"
import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { IsomerSiteProps } from "~/types"
import type { IsomerCollectionPageSitemap } from "~/types/sitemap"
import {
  COLLECTION_PAGE_DEFAULT_SORT_BY,
  COLLECTION_PAGE_DEFAULT_SORT_DIRECTION,
} from "~/types"
import {
  getCollectionItems,
  processCollectionItems,
} from "../../../../layouts/Collection/utils"

interface GetCollectionPagesProps {
  site: IsomerSiteProps
  collectionParent: IsomerCollectionPageSitemap
  categories?: GetCollectionItemsProps["categories"]
}

export const NUMBER_OF_PAGES_TO_DISPLAY = 3

export const getCollectionPages = ({
  site,
  collectionParent,
  categories,
}: GetCollectionPagesProps): ProcessedCollectionCardProps[] => {
  const items = getCollectionItems({
    site,
    permalink: collectionParent.permalink,
    sortBy:
      collectionParent.collectionPagePageProps?.defaultSortBy ??
      COLLECTION_PAGE_DEFAULT_SORT_BY,
    sortDirection:
      collectionParent.collectionPagePageProps?.defaultSortDirection ??
      COLLECTION_PAGE_DEFAULT_SORT_DIRECTION,
    categories,
  })

  if (items.length === 0) {
    throw new Error(
      `CollectionBlock: No collection items found for reference link ${collectionParent.permalink}`,
    )
  }

  return processCollectionItems(items).slice(0, NUMBER_OF_PAGES_TO_DISPLAY)
}
