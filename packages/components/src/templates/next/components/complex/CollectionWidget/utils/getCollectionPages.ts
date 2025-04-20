import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { IsomerSitemap, IsomerSiteProps } from "~/types"
import { DEFAULT_COLLECTION_WIDGET_NUMBER_OF_PAGES } from "~/interfaces"
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
  collectionParent: IsomerSitemap
  numberOfPages?: number
}

export const getCollectionPages = ({
  site,
  collectionParent,
  numberOfPages = parseInt(DEFAULT_COLLECTION_WIDGET_NUMBER_OF_PAGES),
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
  })

  if (items.length === 0) {
    throw new Error(
      `CollectionWidget: No collection items found for reference link ${collectionParent.permalink}`,
    )
  }

  return processCollectionItems(items).slice(0, numberOfPages)
}
