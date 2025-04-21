import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { IsomerSitemap, IsomerSiteProps } from "~/types"
import type { IsomerPageSitemap } from "~/types/sitemap"
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
}

const NUMBER_OF_PAGES_TO_DISPLAY = 3

export const getCollectionPages = ({
  site,
  collectionParent,
}: GetCollectionPagesProps): ProcessedCollectionCardProps[] => {
  const items = getCollectionItems({
    site,
    permalink: collectionParent.permalink,
    sortBy:
      (collectionParent as IsomerPageSitemap).collectionPagePageProps
        ?.defaultSortBy ?? COLLECTION_PAGE_DEFAULT_SORT_BY,
    sortDirection:
      (collectionParent as IsomerPageSitemap).collectionPagePageProps
        ?.defaultSortDirection ?? COLLECTION_PAGE_DEFAULT_SORT_DIRECTION,
  })

  if (items.length === 0) {
    throw new Error(
      `CollectionWidget: No collection items found for reference link ${collectionParent.permalink}`,
    )
  }

  return processCollectionItems(items).slice(0, NUMBER_OF_PAGES_TO_DISPLAY)
}
