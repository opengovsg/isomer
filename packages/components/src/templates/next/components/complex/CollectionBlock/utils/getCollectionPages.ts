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
  // Respect the referenced Collection's showThumbnail setting. When the
  // Collection has it undefined (i.e. the Collection page itself hides
  // thumbnails), CollectionBlock still wants to render a thumbnail and
  // falls back to the site logo.
  const showThumbnail = collectionParent.collectionPagePageProps
    ?.showThumbnail ?? { fallback: "logo" }

  const items = getCollectionItems({
    site,
    permalink: collectionParent.permalink,
    sortOrder: collectionParent.collectionPagePageProps?.sortOrder,
    sortBy: collectionParent.collectionPagePageProps?.defaultSortBy,
    sortDirection:
      collectionParent.collectionPagePageProps?.defaultSortDirection,
    showThumbnail,
  })

  return processCollectionItems(items).slice(0, NUMBER_OF_PAGES_TO_DISPLAY)
}
