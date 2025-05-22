import type { IsomerSiteProps } from "~/types"
import type { IsomerCollectionPageSitemap } from "~/types/sitemap"
import { getSitemapAsArray } from "~/utils/getSitemapAsArray"

interface GetCollectionParentProps {
  site: IsomerSiteProps
  collectionId: string
}

export const getCollectionParent = ({
  site,
  collectionId,
}: GetCollectionParentProps): IsomerCollectionPageSitemap => {
  const sitemapArray = getSitemapAsArray(site.siteMap)

  const collectionParent = sitemapArray.find(
    (item) => item.id === collectionId && item.layout === "collection",
  )

  if (collectionParent) {
    return collectionParent as IsomerCollectionPageSitemap
  }

  throw new Error(
    `CollectionBlock: No collection parent found for collection ID ${collectionId}`,
  )
}
