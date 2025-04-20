import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { IsomerSiteProps } from "~/types"
import { DEFAULT_COLLECTION_WIDGET_NUMBER_OF_PAGES } from "~/interfaces"
import {
  COLLECTION_PAGE_DEFAULT_SORT_BY,
  COLLECTION_PAGE_DEFAULT_SORT_DIRECTION,
} from "~/types"
import { getResourceIdFromReferenceLink } from "~/utils"
import {
  getCollectionItems,
  processCollectionItems,
} from "../../../../layouts/Collection/utils"

interface GetCollectionPagesProps {
  site: IsomerSiteProps
  collectionReferenceLink: string
  numberOfPages?: number
}

export const getCollectionPages = ({
  site,
  collectionReferenceLink,
  numberOfPages = parseInt(DEFAULT_COLLECTION_WIDGET_NUMBER_OF_PAGES),
}: GetCollectionPagesProps): ProcessedCollectionCardProps[] => {
  const collectionId = getResourceIdFromReferenceLink(collectionReferenceLink)

  const collectionParent = site.siteMap.children?.find(
    (child) => child.id === collectionId,
  )

  if (!collectionParent) {
    return []
  }

  console.log(
    1111,
    collectionParent.permalink,
    collectionParent.collectionPagePageProps?.defaultSortBy,
    collectionParent.collectionPagePageProps?.defaultSortDirection,
  )

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

  return processCollectionItems(items).slice(0, numberOfPages)
}
