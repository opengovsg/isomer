import type { ProcessedCollectionCardProps } from "~/interfaces"
import type { IsomerSiteProps } from "~/types"
import type { IsomerCollectionPageSitemap } from "~/types/sitemap"

import { getCollectionItems } from "../../../../layouts/Collection/utils/getCollectionItems"
import { processCollectionItems } from "../../../../layouts/Collection/utils/processCollectionItems"

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
    permalink: collectionParent.permalink,
    showThumbnail,
    site,
    sortBy: collectionParent.collectionPagePageProps?.defaultSortBy,
    sortDirection:
      collectionParent.collectionPagePageProps?.defaultSortDirection,
    sortOrder: collectionParent.collectionPagePageProps?.sortOrder,
    tagCategories: collectionParent.collectionPagePageProps?.tagCategories,
  })

  return processCollectionItems(items).slice(0, NUMBER_OF_PAGES_TO_DISPLAY)
}
